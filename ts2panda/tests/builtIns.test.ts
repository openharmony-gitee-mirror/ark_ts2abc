/*
 * Copyright (c) 2021 Huawei Device Co., Ltd.
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

import {
    expect
} from 'chai';
import 'mocha';
import {
    LdaDyn,
    ReturnUndefined,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("BuiltInsTest", function() {
    it("Global Value Properties", function() {
        let insns = compileMainSnippet(`NaN; Infinity; globalThis;`);
        let expected = [
            new LdaDyn(new VReg()),
            new LdaDyn(new VReg()),
            new LdaDyn(new VReg()),

            new ReturnUndefined()
        ];
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
