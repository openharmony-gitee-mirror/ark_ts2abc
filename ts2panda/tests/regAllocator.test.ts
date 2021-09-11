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

import { expect } from 'chai';
import 'mocha';
import * as ts from "typescript";
import {
    BuiltinAcc,
    BuiltinR2i,
    CallRange,
    Imm,
    IRNode,
    LdaDyn,
    MovDyn,
    ResultType,
    ReturnUndefined,
    StaDyn,
    VReg
} from "../src/irnodes";
import { PandaGen } from "../src/pandagen";
import { CacheExpander } from "../src/pass/cacheExpander";
import { IntrinsicVariantExpander } from "../src/pass/intrinsicVariantExpander";
import { RegAlloc } from "../src/regAllocator";
import { basicChecker, checkInstructions, compileAllSnippet } from "./utils/base";


function checkRegisterNumber(left: IRNode, right: IRNode): boolean {
    if (!basicChecker(left, right)) {
        return false;
    }
    let lo = left.operands;
    let ro = right.operands;
    if (lo.length !== ro.length) {
        return false;
    }
    for (let i = 0; i < lo.length; ++i) {
        let l = lo[i];
        let r = ro[i];
        if (l instanceof VReg && r instanceof VReg) {
            if (!((<VReg>l).num == (<VReg>r).num)) {
                return false;
            }
        }
    }
    return true;
}
describe("RegAllocator", function() {
    it("make spill for Src register", function() {
        let string: string = "";
        for (let i = 0; i < 256; ++i) {
            string += "let a" + i + " = " + i + ";";
        }
        string += "a255;";

        let pgs = compileAllSnippet(string, [new CacheExpander(), new RegAlloc()]);
        let insns = pgs[0].getInsns();
        let v260 = new VReg();
        v260.num = 260;
        let v259 = new VReg();
        v259.num = 259;
        let v258 = new VReg();
        v258.num = 258;
        let v0 = new VReg();
        v0.num = 0;

        let expected: IRNode[] = [
            new MovDyn(v260, v0),
            new StaDyn(v0),
            new MovDyn(v258, v0),
            new MovDyn(v0, v260),

            new MovDyn(v260, v0),
            new MovDyn(v0, v258),
            new LdaDyn(v0),
            new MovDyn(v0, v260),
            new ReturnUndefined()
        ];
        expect(checkInstructions(insns.slice(insns.length - 9), expected, checkRegisterNumber)).to.be.true;
    });

    it("make spill for SrcDst register", function() {
        /* the only possible instruction whose operand register type could be SrcDstVReg is INCI, 
         * but we do not use it at all by now
         */
        expect(true).to.be.true;
    });

    it("make spill for CalliDynRange", function () {
        /* since the bitwitdh for CalliDynRange source register is 16 now, we do not need to make spill at all.
           but later 16 might be changed to 8, then spill operation will be needed in some cases. this testcase is desgined
           for 8bits constraints.
        */
        let string = "";
        for (let i = 0; i < 256; ++i) {
            string += "let a" + i + " = " + i + ";";
        }
        string += "call(a252, a253, a254, a255);";
        let pgs = compileAllSnippet(string, [new CacheExpander(), new IntrinsicVariantExpander(), new RegAlloc()]);
        let insns = pgs[0].getInsns();
        let v = [];
        for (let i = 0; i < 5; ++i) {
            v[i] = new VReg();
            v[i].num = i;
        }
        for (let i = 259; i <= 269; ++i) {
            v[i] = new VReg();
            v[i].num = i;
        }
        let expected = [
            new MovDyn(v[265], v[0]),
            new MovDyn(v[0], v[259]),
            new MovDyn(v[266], v[1]),
            new MovDyn(v[1], v[260]),
            new MovDyn(v[267], v[2]),
            new MovDyn(v[2], v[261]),
            new MovDyn(v[268], v[3]),
            new MovDyn(v[3], v[262]),
            new MovDyn(v[269], v[4]),
            new MovDyn(v[4], v[263]),
            new BuiltinR2i(new Imm(ResultType.Int, 3), new Imm(ResultType.Int, 4), v.slice(0, 5)),
            new MovDyn(v[0], v[265]),
            new MovDyn(v[1], v[266]),
            new MovDyn(v[2], v[267]),
            new MovDyn(v[3], v[268]),
            new MovDyn(v[4], v[269]),
            new BuiltinAcc(new Imm(ResultType.Int, 23)) // ReturnUndefined
        ];
        expect(checkInstructions(insns.slice(insns.length - 17), expected, checkRegisterNumber)).to.be.true;
    });

    it("VReg sequence of CalliDynRange is not continuous", function() {
        let pandaGen = new PandaGen('', 0);

        let para1 = pandaGen.getTemp();
        let para2 = pandaGen.getTemp();
        let para3 = pandaGen.getTemp();
        let para4 = pandaGen.getTemp();
        let para5 = pandaGen.getTemp();
        let para6 = pandaGen.getTemp();

        pandaGen.call(ts.createNode(0), [para1, para2, para3, para4, para5, para6], false);

        pandaGen.freeTemps(para1, para3, para2);

        try {
            new RegAlloc().run(pandaGen);
        } catch (err) {
            expect(true).to.be.true;
            return;
        }
        expect(true).to.be.false;
    });

    it("VReg sequence of DynRange is not continuous", function() {
        let pandaGen = new PandaGen('', 0);

        let para1 = pandaGen.getTemp();
        let para2 = pandaGen.getTemp();
        let para3 = pandaGen.getTemp();

        pandaGen.getInsns().push(new CallRange('test', [para1, para2, para3]))

        pandaGen.freeTemps(para1, para3, para2);

        try {
            new RegAlloc().run(pandaGen);
        } catch (err) {
            expect(true).to.be.true;
            return;
        }
        expect(true).to.be.false;
    });
});
