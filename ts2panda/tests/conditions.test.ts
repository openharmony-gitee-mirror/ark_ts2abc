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
    And2Dyn,
    EqDyn,
    Imm,
    Jeqz,
    Jlez,
    Jmp,
    Label,
    LdaDyn,
    LdaiDyn,
    NotEqDyn,
    ResultType,
    ReturnDyn,
    StaDyn,
    VReg,
    Toboolean,
    ReturnUndefined,
} from "../src/irnodes";
import { checkInstructions, compileMainSnippet } from "./utils/base";

describe("IfConditionTest", function() {
    it('ifConditionEmpty', function() {
        let insns = compileMainSnippet("let s = 1;\n" +
            "if (s > 2) {}");
        let jumps = insns.filter(item => item instanceof Jeqz);

        expect(jumps.length).to.equal(1);

        let targetLabel = (<Jlez>jumps[0]).getTarget();
        // The last instruction is return.
        expect(targetLabel).to.equal(insns[insns.length - 2]);
    });

    it('ifConditionWithThenStatement', function() {
        let insns = compileMainSnippet("let a = 2;\n" +
            "if (a > 4) {\n" +
            "  a = 3;\n" +
            "}");
        let jumps = insns.filter(item => item instanceof Jeqz);

        expect(jumps.length).to.equal(1);

        let targetLabel = (<Jlez>jumps[0]).getTarget();
        // The last instruction is return.
        expect(targetLabel).to.equal(insns[insns.length - 2]);
    });

    it('ifConditionWithThenStatementAndElseStatement', function() {
        let insns = compileMainSnippet("let a = 5;\n" +
            "if (a > 3) {\n" +
            "  a = 2;\n" +
            "} else {\n" +
            "  a = 4;\n" +
            "}");
        let jumps = insns.filter(item => (item instanceof Jeqz || item instanceof Jmp));
        let labels = insns.filter(item => (item instanceof Label));

        expect(jumps.length).to.equal(2);
        expect(labels.length).to.equal(2);

        let elseLabel = (<Jlez>jumps[0]).getTarget();
        let endIfLabel = (<Jmp>jumps[1]).getTarget();

        expect(elseLabel).to.equal(labels[0]);
        expect(endIfLabel).to.equal(labels[1]);

        expect(elseLabel).to.equal(insns[insns.length - 5]);
        expect(endIfLabel).to.equal(insns[insns.length - 2]);
    });

    it("if (a & b)", function() {
        let insns = compileMainSnippet(`
      let a = 1;
      let b = 2;
      if (a & b) {
      }
      `);
        let a = new VReg();
        let b = new VReg();
        let lhs = new VReg();
        let trueReg = new VReg();
        let endIfLabel = new Label();
        let expected = [
            new LdaDyn(a),
            new StaDyn(lhs),
            new LdaDyn(b),
            new And2Dyn(lhs),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(endIfLabel),
            endIfLabel,
        ];
        insns = insns.slice(4, insns.length - 1); // skip let a = 1; let b = 2; and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true
    });

    it("if (a = b)", function() {
        let insns = compileMainSnippet(`
      let a = 1;
      let b = 2;
      if (a = b) {
      }
      `);
        let a = new VReg();
        let b = new VReg();
        let trueReg = new VReg();
        let endIfLabel = new Label();
        let expected = [
            new LdaDyn(b),
            new StaDyn(a),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(endIfLabel),
            endIfLabel,
        ];
        insns = insns.slice(4, insns.length - 1); // skip let a = 1; let b = 2; and return.dyn
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("let a = true ? 5 : 0;", function() {
        let insns = compileMainSnippet(`let a = true ? 5 : 0;`);

        insns = insns.slice(0, insns.length - 1);
        let trueReg = new VReg();
        let tempReg = new VReg();
        let expectedElseLabel = new Label();
        let expectedEndLabel = new Label();
        let expected = [
            new LdaDyn(new VReg()),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(expectedElseLabel),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new Jmp(expectedEndLabel),
            expectedElseLabel,
            new LdaiDyn(new Imm(ResultType.Int, 0)),
            expectedEndLabel,
            new StaDyn(tempReg)
        ];
        expect(checkInstructions(insns, expected)).to.be.true;

        let jumps = insns.filter(item => (item instanceof Jeqz || item instanceof Jmp));
        let labels = insns.filter(item => (item instanceof Label));

        expect(jumps.length).to.equal(2);
        expect(labels.length).to.equal(2);
    });

    it("if (true && 5) {}", function() {
        let insns = compileMainSnippet("if (true && 5) {}");
        let trueReg = new VReg();
        let ifFalseLabel = new Label();
        let expected = [
            new LdaDyn(new VReg()),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(ifFalseLabel),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new Toboolean(),
            new EqDyn(trueReg),
            new Jeqz(ifFalseLabel),
            ifFalseLabel,
            new ReturnUndefined()
        ]
        expect(checkInstructions(insns, expected)).to.be.true;
    });

    it("if (false || 5) {}", function() {
        let insns = compileMainSnippet("if (false || 5) {}");
        let falseReg = new VReg();
        let ifFalseLabel = new Label();
        let endLabel = new Label();
        let expected = [
            new LdaDyn(new VReg()),
            new Toboolean(),
            new EqDyn(falseReg),
            new Jeqz(endLabel),
            new LdaiDyn(new Imm(ResultType.Int, 5)),
            new Toboolean(),
            new NotEqDyn(falseReg),
            new Jeqz(ifFalseLabel),
            endLabel,
            ifFalseLabel,
            new ReturnUndefined()
        ]
        expect(checkInstructions(insns, expected)).to.be.true;
    });
});
