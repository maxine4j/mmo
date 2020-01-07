import sys
import os
import json
import glob
import pathlib

fbx2gltf_exe = "FBX2glTF.exe"

cmd = "{} --embed --binary --input \"{}\" --output \"{}\""

def main():
    if len(sys.argv) != 2:
        print("Usage: <root-model>")
        print("Download facebook fbx-gltf utility from https://github.com/facebookincubator/FBX2glTF")
        exit(1)
    
    # "dir/model.fbx"
    model_fbx = sys.argv[1]
    # "model"
    model_name = pathlib.Path(model_fbx).resolve().stem
    # "dir/"
    root_dir = os.path.dirname(model_fbx)
    # "dir/model_Animations"
    anims_dir = os.path.join(root_dir, model_name + "_Animations")
    # "dir/model_Animations_gltf"
    anims_gltf_dir = os.path.join(root_dir, model_name + "_Animations_gltf")
    pathlib.Path(anims_gltf_dir).mkdir(exist_ok=True)

    cmd_final = cmd.format(fbx2gltf_exe, model_fbx, os.path.join(root_dir, model_name))
    os.system(cmd_final)

    for anim_fbx in glob.glob(os.path.join(anims_dir, "*.fbx")):
        # "anim"
        anim_fbx_name = pathlib.Path(anim_fbx).resolve().stem
        cmd_final = cmd.format(fbx2gltf_exe, anim_fbx, os.path.join(anims_gltf_dir, anim_fbx_name))
        os.system(cmd_final)

if __name__ == "__main__":
    main()
