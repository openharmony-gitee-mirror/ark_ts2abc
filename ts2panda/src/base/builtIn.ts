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

import { PandaGen } from "src/pandagen";
import {
    IRNode,
    LdBigInt,
    LdBoolean,
    LdFalse,
    LdFunction,
    LdGlobal,
    LdHole,
    LdInfinity,
    LdNaN,
    LdNull,
    LdNumber,
    LdObject,
    LdRegExp,
    LdString,
    LdSymbol,
    LdTrue,
    LdUndefined,
    StaDyn
} from "../irnodes";
import { CacheList, getVregisterCache } from "./vregisterCache";

export function expandHole(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.HOLE);
    return [
        new LdHole(),
        new StaDyn(vreg)
    ]
}

export function expandNaN(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.NaN);
    return [
        new LdNaN(),
        new StaDyn(vreg)
    ];
}

export function expandInfinity(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Infinity);
    return [
        new LdInfinity(),
        new StaDyn(vreg)
    ];
}

export function expandGlobal(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Global);
    return [
        new LdGlobal(),
        new StaDyn(vreg)
    ];
}

export function expandUndefined(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.undefined);
    return [
        new LdUndefined(),
        new StaDyn(vreg)
    ];
}

export function expandBoolean(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Boolean);
    return [
        new LdBoolean(),
        new StaDyn(vreg)
    ];
}

export function expandNumber(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Number);
    return [
        new LdNumber(),
        new StaDyn(vreg)
    ];
}

export function expandString(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.String);
    return [
        new LdString(),
        new StaDyn(vreg)
    ];
}

export function expandBigInt(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.BigInt);
    return [
        new LdBigInt(),
        new StaDyn(vreg)
    ];
}

export function expandSymbol(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Symbol);
    return [
        new LdSymbol(),
        new StaDyn(vreg)
    ];
}

export function expandRegExp(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.RegExp);
    return [
        new LdRegExp(),
        new StaDyn(vreg)
    ];
}

export function expandNull(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Null);
    return [
        new LdNull(),
        new StaDyn(vreg)
    ];
}

export function expandObject(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Object);
    return [
        new LdObject(),
        new StaDyn(vreg)
    ];
}

export function expandFunction(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.Function);
    return [
        new LdFunction(),
        new StaDyn(vreg)
    ];
}

export function expandTrue(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.True);
    return [
        new LdTrue(),
        new StaDyn(vreg)
    ];
}

export function expandFalse(pandaGen: PandaGen): IRNode[] {
    let vreg = getVregisterCache(pandaGen, CacheList.False);
    return [
        new LdFalse(),
        new StaDyn(vreg)
    ];
}