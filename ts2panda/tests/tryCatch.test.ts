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
    Imm,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    ResultType,
    ReturnDyn,
    ReturnUndefined,
    StaDyn,
    ThrowDyn,
    VReg
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("TryCatch", function() {
    it('tryCatch', function() {
        let insns = compileMainSnippet(`let a = 0;
                               try {a = 1;}
                               catch {a = 2;}`);

        let a = new VReg();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let catchEndLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(a),
            tryBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            tryEndLabel,
            new Jmp(catchEndLabel),
            catchBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            catchEndLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('tryCatchWithIdentifier', function() {
        let insns = compileMainSnippet(`let a = 0;
                               try {a = 1;}
                               catch(err) {a = 2;}`);

        let a = new VReg();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let catchEndLabel = new Label();
        let err = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(a),
            tryBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            tryEndLabel,
            new Jmp(catchEndLabel),
            catchBeginLabel,
            new StaDyn(err),
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            catchEndLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('tryFinally', function() {
        let insns = compileMainSnippet(`let a = 0;
                               try {a = 1;}
                               finally {a = 3;}`);

        let a = new VReg();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let catchEndLabel = new Label();
        let exceptionVreg = new VReg();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(a),
            tryBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            tryEndLabel,
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(a),
            new Jmp(catchEndLabel),
            catchBeginLabel,
            new StaDyn(exceptionVreg),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(a),
            new LdaDyn(exceptionVreg),
            new ThrowDyn(),
            catchEndLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it('tryCatchFinally', function() {
        let insns = compileMainSnippet(`let a = 0;
                               try {a = 1;}
                               catch {a = 2;}
                               finally {a = 3;}`);

        let a = new VReg();
        let exceptionVreg = new VReg();
        let tryBeginLabel = new Label();
        let tryEndLabel = new Label();
        let catchBeginLabel = new Label();
        let nestedTryBeginLabel = new Label();
        let nestedTryEndLabel = new Label();
        let nestedCatchBeginLabel = new Label();
        let nestedCatchEndLabel = new Label();
        let catchEndLabel = new Label();

        let expected = [
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            new StaDyn(a),
            tryBeginLabel,
            nestedTryBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 1)),
            new StaDyn(a),
            nestedTryEndLabel,
            new Jmp(tryEndLabel),
            nestedCatchBeginLabel,
            new LdaiDyn(new Imm(ResultType.Int, 2)),
            new StaDyn(a),
            nestedCatchEndLabel,
            tryEndLabel,
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(a),
            new Jmp(catchEndLabel),
            catchBeginLabel,
            new StaDyn(exceptionVreg),
            new LdaiDyn(new Imm(ResultType.Int, 3)),
            new StaDyn(a),
            new LdaDyn(exceptionVreg),
            new ThrowDyn(),
            catchEndLabel,
            new ReturnUndefined()
        ];

        expect(checkInstructions(insns, expected)).to.be.true;
    });
});