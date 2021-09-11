#!/usr/bin/env python3
# coding: utf-8

"""
Copyright (c) 2021 Huawei Device Co., Ltd.
Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.

Description: Compile ark front-end code with tsc
"""

import os
import sys
import subprocess
import argparse
import platform


def parse_args():

    parser = argparse.ArgumentParser()

    parser.add_argument('--src-dir',
                        help='Source directory')
    parser.add_argument('--dist-dir',
                        help='Destination directory')
    parser.add_argument('--platform',
                        help='platform, as: linux, mac, win')
    parser.add_argument('--node',
                        help='node path')
    parser.add_argument("--node-modules",
                        help='path to node-modules exetuable')

    arguments = parser.parse_args()
    return arguments


def set_env(node_dir):
    jsoner_format = ":"
    if platform.system() == "Windows":
        jsoner_format = ";"
    os.environ["PATH"] = f'{node_dir}{jsoner_format}{os.environ["PATH"]}'


def run_command(cmd, execution_path=os.getcwd()):
    print(" ".join(cmd) + " | execution_path: " + execution_path)
    proc = subprocess.Popen(cmd, cwd=execution_path)
    ret = proc.wait()
    assert not ret, f'\n{" ".join(cmd)} failed'


def node_modules(options):
    src_dir = options.src_dir
    dist_dir = options.dist_dir
    run_command(['cp', '-f', os.path.join(src_dir, "package.json"),
                 os.path.join(dist_dir, "package.json")])
    run_command(['cp', '-f', os.path.join(src_dir, "package-lock.json"),
                 os.path.join(dist_dir, "package-lock.json")])

    if options.node_modules:
        run_command(['cp', '-rf', options.node_modules,
                     os.path.join(dist_dir, "node_modules")])
    else:
        run_command(['npm', 'install'], dist_dir)


def npm_run_build(options):
    plat_form = options.platform
    os.chdir(options.dist_dir)
    tsc = "node_modules/typescript/bin/tsc"

    if plat_form == "linux":
        cmd = [tsc, '-b', 'src']
        run_command(cmd, options.dist_dir)
    elif plat_form == "win":
        cmd = [tsc, '-b', 'src/tsconfig.win.json']
        run_command(cmd, options.dist_dir)
    elif plat_form == 'mac':
        cmd = [tsc, '-b', 'src/tsconfig.mac.json']
        run_command(cmd, options.dist_dir)


def main():
    ARGS = parse_args()
    set_env(ARGS.node)
    if not os.path.exists(os.path.join(ARGS.dist_dir, "node_modules")):
        node_modules(ARGS)
    npm_run_build(ARGS)


if __name__ == "__main__":
    sys.exit(main())
