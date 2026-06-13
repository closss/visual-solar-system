from __future__ import annotations

import argparse
import json
from pathlib import Path
from time import time

import numpy as np
import torch
import trimesh
from natsort import natsorted
from PIL import Image

from mapanything.utils.device import get_device
from mapanything.utils.geometry import depthmap_to_world_frame
from mapanything.utils.hf_utils.hf_helpers import initialize_mapanything_local
from mapanything.utils.image import load_images


def _force_cached_dinov2_ref() -> None:
    original_load = torch.hub.load

    def load(repo_or_dir, model, *args, **kwargs):
        if repo_or_dir == "facebookresearch/dinov2":
            repo_or_dir = "facebookresearch/dinov2:main"
        return original_load(repo_or_dir, model, *args, **kwargs)

    torch.hub.load = load


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Run MapAnything offline and export an object-masked point cloud"
    )
    parser.add_argument("--image_folder", required=True)
    parser.add_argument("--mask_folder", required=True)
    parser.add_argument("--output_path", required=True)
    parser.add_argument("--memory_efficient_inference", action="store_true", default=True)
    parser.add_argument("--minibatch_size", type=int, default=1)
    return parser.parse_args()


def load_object_masks(mask_folder: str, count: int) -> list[Path]:
    mask_paths = natsorted(
        path
        for path in Path(mask_folder).iterdir()
        if path.suffix.lower() in {".png", ".jpg", ".jpeg"}
    )
    if len(mask_paths) != count:
        raise ValueError(f"Expected {count} masks, found {len(mask_paths)}")
    return mask_paths


def main() -> None:
    args = parse_args()
    _force_cached_dinov2_ref()
    output_path = Path(args.output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    device = get_device()
    local_config = {
        "path": "configs/train.yaml",
        "model_str": "mapanything",
        "config_overrides": [
            "machine=aws",
            "model=mapanything",
            "model/task=images_only",
            "model.encoder.uses_torch_hub=false",
            "+model.encoder.torch_hub_pretrained=false",
        ],
        "checkpoint_path": "ckpt/model.safetensors",
        "config_json_path": "config.json",
        "strict": False,
    }

    print(f"device={device}")
    model = initialize_mapanything_local(local_config, device)
    model.eval()

    views = load_images(args.image_folder)
    if not views:
        raise ValueError(f"No images found in {args.image_folder}")
    mask_paths = load_object_masks(args.mask_folder, len(views))
    print(f"views={len(views)}")

    start = time()
    with torch.no_grad():
        outputs = model.infer(
            views,
            memory_efficient_inference=args.memory_efficient_inference,
            minibatch_size=args.minibatch_size,
            use_amp=True,
            amp_dtype="bf16",
            apply_mask=True,
            mask_edges=True,
            apply_confidence_mask=False,
            confidence_percentile=50,
        )
    print(f"inference_seconds={time() - start:.3f}")

    vertices_list: list[np.ndarray] = []
    colors_list: list[np.ndarray] = []
    cameras = []

    for idx, (pred, mask_path) in enumerate(zip(outputs, mask_paths, strict=True)):
        depthmap = pred["depth_z"][0].squeeze(-1)
        intrinsics = pred["intrinsics"][0]
        camera_pose = pred["camera_poses"][0]
        pts3d, valid_mask = depthmap_to_world_frame(depthmap, intrinsics, camera_pose)

        image_np = pred["img_no_norm"][0].cpu().numpy()
        height, width = image_np.shape[:2]
        object_mask = Image.open(mask_path).convert("L").resize(
            (width, height),
            Image.Resampling.NEAREST,
        )
        object_mask_np = np.asarray(object_mask) > 127

        model_mask = pred["mask"][0].squeeze(-1).cpu().numpy().astype(bool)
        final_mask = model_mask & valid_mask.cpu().numpy() & object_mask_np
        pts3d_np = pts3d.cpu().numpy()

        vertices_list.append(pts3d_np[final_mask])
        colors_list.append((image_np[final_mask] * 255).astype(np.uint8))
        cameras.append(
            {
                "index": idx,
                "K": intrinsics.detach().cpu().tolist(),
                "cam2world": camera_pose.detach().cpu().tolist(),
                "width": width,
                "height": height,
                "mask_coverage": float(object_mask_np.mean()),
            }
        )

    vertices = np.concatenate(vertices_list, axis=0)
    colors = np.concatenate(colors_list, axis=0)
    scene_3d = trimesh.Scene()
    scene_3d.add_geometry(trimesh.PointCloud(vertices=vertices, colors=colors))
    scene_3d.apply_transform(trimesh.transformations.rotation_matrix(np.pi, [1, 0, 0]))
    scene_3d.export(output_path)

    cameras_path = output_path.with_suffix(".cameras.json")
    cameras_path.write_text(json.dumps(cameras, indent=2), encoding="utf-8")
    print(f"points={len(vertices)}")
    print(f"saved_glb={output_path}")
    print(f"saved_cameras={cameras_path}")


if __name__ == "__main__":
    main()
