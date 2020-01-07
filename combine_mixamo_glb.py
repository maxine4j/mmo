import sys
import os
import json
import glob
import pathlib

fbgltf = ""
model_name = ""
fbx_anims_dir = ""

cmd = "{} --embed --input \"{}\" --output \"{}\""

def main():
    if len(sys.argv) != 4:
        print("Usage: <facebook-fbx-gltf-path> <model-name> <fbx-anims-dir>")
        print("Download facebook fbx-gltf utility from https://github.com/facebookincubator/FBX2glTF")
        exit(1)
    
    fbgltf = sys.argv[1]
    model_name = sys.argv[2]
    fbx_anims_dir = sys.argv[3]
    gltf_anims_dir = os.path.join(fbx_anims_dir, "gltf")
    pathlib.Path(gltf_anims_dir).mkdir(exist_ok=True)

    for fbx_file_path in glob.glob(os.path.join(fbx_anims_dir, "*.fbx")):
        fbx_file_name = os.path.split(fbx_file_path)[-1].split('.')[0]
        # print("fbx_file_path: {}".format(fbx_file_path))
        # print("fbx_file_name: {}".format(fbx_file_name))
        cmd_final = cmd.format(fbgltf, fbx_file_path, os.path.join(gltf_anims_dir, fbx_file_name))
        print("CMD: {}".format(cmd_final))
        os.system(cmd_final)

if __name__ == "__main__":
    main()
