import { AsyncLocalStorage } from "async_hooks"
import assert = require("node:assert");
import { performance } from "perf_hooks"

const asyncStorage = new AsyncLocalStorage();

export interface TimingNode {
    name: string
    start: number
    end: number
    children: TimingNode[]
}

export async function measure<T>(name: string, cb: () => Promise<T>): Promise<[T, TimingNode]> {
    let node: Partial<TimingNode> = { name, children: [], start: performance.now(), end: undefined }
    
    let ret = await asyncStorage.run(node, cb)
    node.end = performance.now()
    
    if (asyncStorage.getStore()) {
        (asyncStorage.getStore() as TimingNode).children.push(node as TimingNode)
    }

    return [ret, node as TimingNode]
}

export function alwaysMeasure() {
    return function<B, F extends (...a: any[]) => Promise<B>>(target: any, name: string, descriptor: TypedPropertyDescriptor<F>) {
        const inner = descriptor.value!
        descriptor.value = (async function(...args: any[]) {
            // Figure out a better way to type this
            // @ts-ignore
            const _this = this
            const [_ret, _] = await measure(name, () => inner.apply(_this, args))
            return _ret
        }) as unknown as F
    }
}

export function explicitEnter(name: string): () => TimingNode {
    let node: Partial<TimingNode> = { name, children: [], start: performance.now(), end: undefined }
    let ogNode = asyncStorage.getStore() as TimingNode
    asyncStorage.enterWith(node)
    
    return () => {
        assert.strictEqual(name, (asyncStorage.getStore() as TimingNode).name)
        node.end = performance.now()
        if (ogNode) {
            ogNode.children.push(node as TimingNode)
            asyncStorage.enterWith(ogNode)
        }

        return node as TimingNode
    }
}