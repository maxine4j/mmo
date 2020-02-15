import sys
import os
import math
import json
from PIL import Image

def main():
    if len(sys.argv) != 5:
        print("Usage: <src-dir> <atlas-name> <icon-dim> <col-count>")
        exit(1)

    src_dir = sys.argv[1]
    atlas_name = sys.argv[2]
    icon_dim = int(sys.argv[3])
    col_count = int(sys.argv[4])

    print("Loading images from:", src_dir)

    cur_dir = os.getcwd()
    os.chdir(src_dir)

    imgs = []
    for src in os.listdir(src_dir):
        imgs.append((src, Image.open(src)))

    icon_count = len(imgs)

    print("Input count:", icon_count)
    print("Output icon dimensions:", icon_dim)
    print("Output column count:", col_count)

    row_count = math.ceil(icon_count / col_count)
    print("Output row count:", row_count)

    output_width = icon_dim * col_count
    output_height = icon_dim * row_count
    print("Output atlas width:", output_width)
    print("Output atlas height:", output_height)

    atlas_img = Image.new('RGB', (output_width, output_height))
    atlas_def = {
        "id": atlas_name,
        "src": "assets/atlases/{}.png".format(atlas_name),
        "sprites": {}
    }
    for idx, (src, img) in enumerate(imgs):
        resized_img = img.resize((icon_dim, icon_dim), resample=Image.BILINEAR)
        xidx = idx % col_count
        yidx = int(idx / col_count)
        x = xidx * icon_dim
        y = yidx * icon_dim
        w, h = img.size
        atlas_img.paste(resized_img, box=(x, y))
        img_id = os.path.splitext(src)[0]
        atlas_def["sprites"][img_id] = {
            "id": img_id,
            "src": {
                "x": x,
                "y": y,
                "w": icon_dim,
                "h": icon_dim,
            }
        }

    os.chdir(cur_dir)

    atlas_img_path = "{}.png".format(atlas_name)
    print("Saving atlas image:", atlas_img_path)
    atlas_img.save("{}.png".format(atlas_name), format="PNG")

    atlas_def_path = "{}.atlas.json".format(atlas_name)
    print("Saving atlas definition:", atlas_def_path)
    with open(atlas_def_path, "w") as f:
        json.dump(atlas_def, f, indent=4)



if __name__ == "__main__":
    main()
