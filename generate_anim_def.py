import sys
import os
import json
import glob
import pathlib

def main():
    if len(sys.argv) != 2:
        print("Usage: <root-model>")
        exit(1)
    
    model_path = sys.argv[1]
    model_name = pathlib.Path(model_path).resolve().stem
    root_dir = os.path.dirname(model_path)
    anim_dir = os.path.join(root_dir, "anims")
    print("Creating definition for \"{}\"".format(model_name))
    print("Anims in \"{}\"".format(anim_dir))

    model_def = {
        "main": model_name + '.glb',
        "animDir": "anims",
        "anims": {}
    }

    anim_count = 0
    for anim_file in os.listdir(anim_dir):
        anim_count += 1
        name_parts = anim_file.split('_')
        anim_name = name_parts[1]
        if anim_name in model_def["anims"]:
            anim_name += name_parts[2].split(".")[0]
        model_def["anims"][anim_name] = anim_file

    print("Found {} anims. Added {} to model def".format(anim_count, len(model_def["anims"])))

    json_file = os.path.join(root_dir, model_name + ".model.json")
    print("Dumping to \"{}\"".format(json_file))
    with open(json_file, "w") as f:
        json.dump(model_def, f)


if __name__ == "__main__":
    main()
