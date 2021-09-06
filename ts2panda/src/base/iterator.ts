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

import * as ts from "typescript";
import {
    VReg
} from "../irnodes";
import { PandaGen } from "../pandagen";

export class Iterator {
    private iterRecord: { iterator: VReg, nextMethod: VReg };
    private iterDone: VReg;
    private iterValue: VReg;
    private pandaGen: PandaGen;
    private node: ts.Node;

    constructor(iterRecord: {iterator: VReg, nextMethod: VReg}, iterDone: VReg, iterValue: VReg, pandaGen: PandaGen, node: ts.Node) {
        this.iterRecord = iterRecord;
        this.iterDone = iterDone;
        this.iterValue = iterValue;
        this.pandaGen = pandaGen;
        this.node = node;
    }

    getIterator() {
        let pandaGen = this.pandaGen;
        let iterator = this.iterRecord.iterator;

        // get iterator
        pandaGen.getIterator(this.node);
        pandaGen.storeAccumulator(this.node, iterator);

        // get the next method
        pandaGen.loadObjProperty(this.node, iterator, "next");
        pandaGen.storeAccumulator(this.node, this.iterRecord.nextMethod);
    }

    /**
     *  iterResult = nextMethod.call(iterator);
     *  if (!isObject(iterResult)) {
     *      throw TypeError
     *  }
     **/
    callNext(iterResult: VReg) {
        this.pandaGen.getIteratorNext(this.node, this.iterRecord.iterator, this.iterRecord.nextMethod);
        this.pandaGen.storeAccumulator(this.node, iterResult);
    }

    iteratorComplete(iterResult: VReg) {
        this.pandaGen.loadObjProperty(this.node, iterResult, "done");
        this.pandaGen.storeAccumulator(this.node, this.iterDone);
    }

    iteratorValue(iterResult: VReg) {
        this.pandaGen.loadObjProperty(this.node, iterResult, "value");
        this.pandaGen.storeAccumulator(this.node, this.iterValue);
    }

    close() {
        this.pandaGen.closeIterator(this.node, this.iterRecord.iterator);
    }

    getCurrentValue() {
        return this.iterValue;
    }

    getCurrrentDone() {
        return this.iterDone;
    }
}