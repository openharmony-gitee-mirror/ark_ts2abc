/* * Copyright (c) 2021 Huawei Device Co., Ltd.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#ifndef PANDA_TS2ABC_OPTIONS_GEN_H_
#define PANDA_TS2ABC_OPTIONS_GEN_H_

#include "utils/pandargs.h"

#include <optional>
#include <string>
#include <unordered_set>
#include <vector>

namespace panda::ts2abc {
class Options {
public:

    explicit Options(const std::string &exePath) : exe_dir_(GetExeDir(exePath)) {}

    ~Options() = default;

    void AddOptions(PandArgParser *parser) {}

private:
    static std::string GetExeDir(const std::string &exePath)
    {
        auto pos = exePath.find_last_of('/');
        return exePath.substr(0, pos);
    }

    std::string exe_dir_;
};
} // namespace panda::ts2abc

enum OptLevel {
    O_LEVEL0 = 0,
    O_LEVEL1,
    O_LEVEL2
};

#endif // PANDA_TS2ABC_OPTIONS_GEN_H_