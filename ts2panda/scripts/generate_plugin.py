#!/usr/bin/env python3
#coding: utf-8

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
Description: Generate interface to get java plugin's js code and binary
"""

import os
import subprocess
import argparse

JAVA_FILE_SUFFIX = "JsCode"
JS_BIN_EXT = ".abc"
ARRAY_MAX = 8192  # size of 8K


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--node",
                        help="path to nodejs exetuable")
    parser.add_argument("--frontend-tool-path",
                        help="path to frontend conversion tool")
    parser.add_argument("--node-modules",
                        help='path to node-modules exetuable')
    parser.add_argument("--plugin-path",
                        help="plugin js file path")
    parser.add_argument("--plugin-name",
                        help="name of js file, ex: BatteryPlugin.js")
    parser.add_argument("--generated-file",
                        help="name of generated file")
    parser.add_argument("--package-name",
                        help="name of generated file's package")

    arguments = parser.parse_args()
    return arguments


def split_array_by_n(array, max_len):
    for i in range(0, len(array), max_len):
        yield array[i: i + max_len]


def gen_bin_info(input_arguments):
    file_name = input_arguments.plugin_name
    file_path = input_arguments.plugin_path
    js_file = os.path.join(file_path, file_name)
    file_name_pre = os.path.splitext(file_name)[0]

    generate_js_bytecode = os.path.join(
        os.path.dirname(__file__), "generate_js_bytecode.py")

    (out_dir, _) = os.path.split(input_arguments.generated_file)
    dst_file = os.path.join(out_dir, f'{file_name_pre}{JS_BIN_EXT}')

    args = [
        '--src-js',
        js_file,
        '--dst-file',
        dst_file,
        '--node',
        input_arguments.node,
        '--frontend-tool-path',
        input_arguments.frontend_tool_path,
        '--node-modules',
        input_arguments.node_modules,
    ]

    proc = subprocess.Popen(['python3', generate_js_bytecode] + args)
    return_code = proc.wait()
    return return_code


def gen_java_method(input_arguments):

    file_name = input_arguments.plugin_name
    file_path = input_arguments.plugin_path
    out_file = input_arguments.generated_file

    file_name_pre = os.path.splitext(file_name)[0]
    js_src_file = os.path.join(file_path, file_name)
    (out_dir, _) = os.path.split(input_arguments.generated_file)
    js_bin_file = os.path.join(out_dir, file_name_pre + JS_BIN_EXT)

    with open(out_file, "w") as output:
        output.write("/*%s * Generated from Java and JavaScript plugins by ts2abc.%s */%s%s"
                     % (os.linesep, os.linesep, os.linesep, os.linesep))

        output.write("package %s;%s"
                     % (input_arguments.package_name, os.linesep))
        output.write("%s" % os.linesep)
        output.write("public class %s%s {%s"
                     % (file_name_pre, JAVA_FILE_SUFFIX, os.linesep))

        # write method: getJsCode
        with open(js_src_file, "r") as input_src:
            output.write("    public static String getJsCode() {%s"
                         % os.linesep)
            output.write("        return%s" % os.linesep)
            lines = input_src.readlines()
            for line in lines[:-1]:
                line = line.strip(os.linesep)
                line = line.replace("\"", "\\\"")
                output.write("        \"%s\\n\" +%s" % (line, os.linesep))

            last_line = lines[-1].replace("\"", "\\\"").strip(os.linesep)
            output.write("        \"%s\";%s" % (last_line, os.linesep))
            output.write("    }%s" % os.linesep)

        output.write("%s" % os.linesep)

        # write method: getJsBytecode
        with open(js_bin_file, "rb") as input_bin:
            # seperate bytecode list
            buf = bytearray(os.path.getsize(js_bin_file))
            input_bin.readinto(buf)
            hex_str = [hex(i) for i in buf]
            byte_str = ["(byte)" + i for i in hex_str]
            seperate_array = split_array_by_n(byte_str, ARRAY_MAX)

            # generate seperate methods for js bytecode with ARRAY_MAX
            method_idx = 0
            method_len_list = []
            for array in seperate_array:
                output.write("    private static byte[] getJsByteCode_%s() {%s"
                             % (method_idx, os.linesep))
                output.write("        return new byte[] {")
                output.write(", ".join(array))
                output.write("};%s" % os.linesep)
                output.write("    }%s" % os.linesep)
                method_idx = method_idx + 1
                method_len_list.append(len(array))

            # generate a method collect all seperated arrays
            cur_pos = 0
            output.write("    public static byte[] getJsByteCode() {%s"
                         % os.linesep)
            output.write("        byte[] allByteCode = new byte[%s];%s"
                         % (len(byte_str), os.linesep))
            for idx, method_len in enumerate(method_len_list):
                output.write("        System.arraycopy(getJsByteCode_%s(), "
                             "0, allByteCode, %s, %s);%s"
                             % (idx, cur_pos, method_len, os.linesep))
                cur_pos = cur_pos + method_len
            output.write("        return allByteCode;%s" % os.linesep)
            output.write("    }%s" % os.linesep)

        output.write("}")


def operate_file(input_arguments):
    retcode = gen_bin_info(input_arguments)
    if retcode != 0:
        return

    gen_java_method(input_arguments)


if __name__ == "__main__":
    operate_file(parse_args())
