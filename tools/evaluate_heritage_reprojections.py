from __future__ import annotations

import argparse
import csv
import json
import math
from dataclasses import dataclass
from pathlib import Path

import cv2
import matplotlib.pyplot as plt
import numpy as np
import trimesh


@dataclass(frozen=True)
class Asset:
    asset_id: str
    label: str
    input_dir: str
    output_stem: str


ASSETS = [
    Asset("nefertiti", "Nefertiti Bust", "nefertiti", "nefertiti-object"),
    Asset("fangyi", "Bronze Fang Yi", "fangyi", "fangyi"),
    Asset("cosmic-buddha", "Cosmic Buddha", "cosmic-buddha", "cosmic-buddha"),
    Asset(
        "apollo-11-command-module",
        "Apollo 11 Command Module",
        "apollo-11-command-module",
        "apollo-11-command-module-object",
    ),
    Asset(
        "hoa-hakananai-a",
        "Hoa Hakananai'a",
        "hoa-hakananai-a",
        "hoa-hakananai-a-object",
    ),
    Asset(
        "incense-burner",
        "Tripod Incense Burner",
        "incense-burner",
        "incense-burner-object",
    ),
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Evaluate MapAnything point clouds by reprojecting them to input cameras."
    )
    parser.add_argument("--project-root", required=True, type=Path)
    parser.add_argument("--output-dir", required=True, type=Path)
    return parser.parse_args()


def image_paths(folder: Path) -> list[Path]:
    return sorted(
        path
        for path in folder.iterdir()
        if path.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )


def foreground_mask(image: np.ndarray, mask_path: Path | None) -> np.ndarray:
    height, width = image.shape[:2]
    if mask_path and mask_path.exists():
        mask = cv2.imread(str(mask_path), cv2.IMREAD_GRAYSCALE)
        if mask is None:
            raise ValueError(f"Unable to read mask: {mask_path}")
        return cv2.resize(mask, (width, height), interpolation=cv2.INTER_NEAREST) > 127

    border = np.concatenate(
        [
            image[:8].reshape(-1, 3),
            image[-8:].reshape(-1, 3),
            image[:, :8].reshape(-1, 3),
            image[:, -8:].reshape(-1, 3),
        ],
        axis=0,
    )
    background = np.median(border, axis=0)
    distance = np.linalg.norm(image.astype(np.float32) - background, axis=2)
    mask = (distance > 18).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    mask = cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel)
    return mask > 0


def load_point_cloud(path: Path) -> tuple[np.ndarray, np.ndarray]:
    scene = trimesh.load(path)
    if not isinstance(scene, trimesh.Scene) or len(scene.geometry) != 1:
        raise ValueError(f"Expected one point cloud in {path}")
    geometry = next(iter(scene.geometry.values()))
    if not isinstance(geometry, trimesh.points.PointCloud):
        raise ValueError(f"Expected point cloud geometry in {path}")
    return (
        np.asarray(geometry.vertices, dtype=np.float64),
        np.asarray(geometry.visual.vertex_colors[:, :3], dtype=np.uint8),
    )


def project_points(
    points: np.ndarray,
    colors: np.ndarray,
    intrinsics: np.ndarray,
    cam2world: np.ndarray,
    width: int,
    height: int,
) -> tuple[np.ndarray, np.ndarray]:
    world2cam = np.linalg.inv(cam2world)
    camera_points = points @ world2cam[:3, :3].T + world2cam[:3, 3]
    positive = camera_points[:, 2] > 1e-6
    camera_points = camera_points[positive]
    projected_colors = colors[positive]

    pixels = camera_points @ intrinsics.T
    u = np.rint(pixels[:, 0] / pixels[:, 2]).astype(np.int32)
    v = np.rint(pixels[:, 1] / pixels[:, 2]).astype(np.int32)
    z = camera_points[:, 2]
    inside = (u >= 0) & (u < width) & (v >= 0) & (v < height)
    u, v, z = u[inside], v[inside], z[inside]
    projected_colors = projected_colors[inside]

    flat_index = v * width + u
    order = np.lexsort((z, flat_index))
    sorted_index = flat_index[order]
    _, first = np.unique(sorted_index, return_index=True)
    selected = order[first]

    rendered = np.zeros((height * width, 3), dtype=np.uint8)
    valid = np.zeros(height * width, dtype=bool)
    rendered[flat_index[selected]] = projected_colors[selected]
    valid[flat_index[selected]] = True
    return rendered.reshape(height, width, 3), valid.reshape(height, width)


def masked_ssim(reference: np.ndarray, rendered: np.ndarray, valid: np.ndarray) -> float:
    reference = reference.astype(np.float32)
    rendered = rendered.astype(np.float32)
    c1 = (0.01 * 255) ** 2
    c2 = (0.03 * 255) ** 2
    scores = []

    for channel in range(3):
        x = reference[:, :, channel]
        y = rendered[:, :, channel]
        mean_x = cv2.GaussianBlur(x, (11, 11), 1.5)
        mean_y = cv2.GaussianBlur(y, (11, 11), 1.5)
        variance_x = cv2.GaussianBlur(x * x, (11, 11), 1.5) - mean_x * mean_x
        variance_y = cv2.GaussianBlur(y * y, (11, 11), 1.5) - mean_y * mean_y
        covariance = cv2.GaussianBlur(x * y, (11, 11), 1.5) - mean_x * mean_y
        numerator = (2 * mean_x * mean_y + c1) * (2 * covariance + c2)
        denominator = (
            (mean_x * mean_x + mean_y * mean_y + c1)
            * (variance_x + variance_y + c2)
        )
        scores.append(numerator / np.maximum(denominator, 1e-8))

    score_map = np.mean(scores, axis=0)
    return float(np.mean(score_map[valid]))


def evaluate_asset(project_root: Path, asset: Asset) -> dict[str, float | int | str]:
    inputs = project_root / "reconstruction_inputs" / asset.input_dir
    outputs = project_root / "recon_outputs"
    cameras = json.loads(
        (outputs / f"{asset.output_stem}.cameras.json").read_text(encoding="utf-8")
    )
    points, colors = load_point_cloud(outputs / f"{asset.output_stem}.glb")
    images = image_paths(inputs / "images")
    masks = image_paths(inputs / "masks") if (inputs / "masks").exists() else []
    if len(images) != len(cameras):
        raise ValueError(
            f"{asset.asset_id}: {len(images)} images but {len(cameras)} cameras"
        )

    psnr_values = []
    ssim_values = []
    coverage_values = []
    for index, (image_path, camera) in enumerate(zip(images, cameras, strict=True)):
        reference_bgr = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
        if reference_bgr is None:
            raise ValueError(f"Unable to read image: {image_path}")
        width, height = int(camera["width"]), int(camera["height"])
        reference_bgr = cv2.resize(
            reference_bgr, (width, height), interpolation=cv2.INTER_AREA
        )
        reference = cv2.cvtColor(reference_bgr, cv2.COLOR_BGR2RGB)
        mask_path = masks[index] if index < len(masks) else None
        object_mask = foreground_mask(reference, mask_path)
        rendered, projected = project_points(
            points,
            colors,
            np.asarray(camera["K"], dtype=np.float64),
            np.asarray(camera["cam2world"], dtype=np.float64),
            width,
            height,
        )
        overlap = object_mask & projected
        if not np.any(overlap):
            raise ValueError(f"{asset.asset_id}: no projected pixels for view {index}")

        error = (
            reference[overlap].astype(np.float32)
            - rendered[overlap].astype(np.float32)
        )
        mse = float(np.mean(error * error))
        psnr_values.append(10 * math.log10((255 * 255) / max(mse, 1e-8)))
        ssim_values.append(masked_ssim(reference, rendered, overlap))
        coverage_values.append(float(overlap.sum() / max(object_mask.sum(), 1)))

    source_size = (outputs / f"{asset.output_stem}.glb").stat().st_size
    return {
        "id": asset.asset_id,
        "name": asset.label,
        "views": len(images),
        "points": len(points),
        "source_glb_mb": source_size / (1024 * 1024),
        "psnr_db": float(np.mean(psnr_values)),
        "ssim": float(np.mean(ssim_values)),
        "coverage": float(np.mean(coverage_values)),
    }


def write_csv(rows: list[dict[str, float | int | str]], path: Path) -> None:
    fields = [
        "id",
        "name",
        "views",
        "points",
        "source_glb_mb",
        "psnr_db",
        "ssim",
        "coverage",
    ]
    with path.open("w", newline="", encoding="utf-8") as file:
        writer = csv.DictWriter(file, fieldnames=fields)
        writer.writeheader()
        writer.writerows(rows)


def write_chart(rows: list[dict[str, float | int | str]], path: Path) -> None:
    labels = [str(row["name"]) for row in rows]
    psnr = [float(row["psnr_db"]) for row in rows]
    ssim = [float(row["ssim"]) for row in rows]
    coverage = [float(row["coverage"]) for row in rows]
    positions = np.arange(len(rows))

    figure, axes = plt.subplots(2, 1, figsize=(11, 7.2), constrained_layout=True)
    axes[0].bar(positions, psnr, color="#4c8da8")
    axes[0].set_ylabel("PSNR (dB)")
    axes[0].set_title("MapAnything reconstruction reprojection metrics")
    axes[0].grid(axis="y", alpha=0.25)
    axes[0].set_xticks([])
    for position, value in zip(positions, psnr, strict=True):
        axes[0].text(position, value + 0.3, f"{value:.2f}", ha="center", fontsize=8)

    width = 0.36
    axes[1].bar(positions - width / 2, ssim, width, label="SSIM", color="#72a56f")
    axes[1].bar(
        positions + width / 2,
        coverage,
        width,
        label="Coverage",
        color="#c69555",
    )
    axes[1].set_ylim(0, 1.08)
    axes[1].set_ylabel("Score")
    axes[1].grid(axis="y", alpha=0.25)
    axes[1].legend()
    axes[1].set_xticks(positions, labels, rotation=15, ha="right")
    for position, value in zip(positions, ssim, strict=True):
        axes[1].text(
            position - width / 2,
            value + 0.015,
            f"{value:.3f}",
            ha="center",
            fontsize=7,
        )
    figure.savefig(path, dpi=180, facecolor="white")
    plt.close(figure)


def main() -> None:
    args = parse_args()
    args.output_dir.mkdir(parents=True, exist_ok=True)
    rows = [evaluate_asset(args.project_root, asset) for asset in ASSETS]
    write_csv(rows, args.output_dir / "reconstruction_metrics.csv")
    (args.output_dir / "reconstruction_metrics.json").write_text(
        json.dumps(rows, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    write_chart(rows, args.output_dir / "reconstruction_metrics.png")
    print(json.dumps(rows, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
