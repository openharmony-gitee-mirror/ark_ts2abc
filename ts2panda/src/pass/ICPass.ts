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
    Intrinsic, IRNode
} from "../irnodes";
import { LOGE } from "../log";
import { PandaGen } from "../pandagen";
import { Pass } from "../pass";

class ICPassImpl {
    constructor() { }

    run(pg: PandaGen): void {
        let insns: IRNode[] = pg.getInsns();
        let icSize: number = 0;

        for (let i = 0; i < insns.length; ++i) {
            if (!(insns[i] instanceof Intrinsic)) {
                continue;
            }

            let ins: Intrinsic = <Intrinsic>(insns[i]);
            if (!ins.hasIC()) {
                continue;
            }

            icSize = ins.updateICOffset(icSize);
        }

        if (icSize >= 0xFFFF) {
            LOGE("ICPass: <" + pg.internalName + "> slot size overflow! total:" + icSize);
        }
        pg.setICSize(icSize);
    }
}

export class ICPass implements Pass {
    run(pg: PandaGen): void {
        let icPass = new ICPassImpl();
        icPass.run(pg);
    }
}