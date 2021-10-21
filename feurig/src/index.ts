import { AsyncLocalStorage } from "async_hooks"
import assert = require("node:assert");
import { performance } from "perf_hooks"

const THROW_DEBUG_ERRORS = process.env.NODE_ENV !== "production"
const asyncStorage = new AsyncLocalStorage();

export interface TimingNode {
    name: string
    start: number
    end: number
    children: TimingNode[]
}


/**
 * Measure the runtime of a function and insert it into the outer measurement
 * context if it exists.
 * @returns [T, TimingNode] where T is the return value of 'cb' and TimingNode is the node representing 'cb'
 */
export async function measure<T>(name: string, cb: () => Promise<T>): Promise<[T, TimingNode]> {
    let node: Partial<TimingNode> = { name, children: [], start: performance.now(), end: undefined }

    let ret = await asyncStorage.run(node, cb)
    node.end = performance.now()

    if (asyncStorage.getStore()) {
        (asyncStorage.getStore() as TimingNode).children.push(node as TimingNode)
    }

    return [ret, node as TimingNode]
}

/**
 * Insert a TimingNode into the current context.
 * Use this if you have another source of feurig measurements, like a child process or external service
 * and want to include those measurements.
 * @throws Only if NODE_ENV is not production, will make sure that the node you want to insert is actually in
 * the timespan of the containing context and throw if it isn't. This also includes trying to insert a node that ends before it starts.
 * @throws If there is no containing context to insert the node into.
 * @param node The node to insert
 */
export function insertTimingNode(node: TimingNode) {
    const outer = asyncStorage.getStore() as TimingNode
    if (!outer) throw new Error("Trying to insertTimingNode with no containing context")

    if (THROW_DEBUG_ERRORS) {
        if (node.start > node.end) {
            throw new Error("Trying to insertTimingNode that starts before it ends.")
        }
        if (node.start < outer.start || node.end > performance.now()) {
            throw new Error("Trying to insertTimingNode which is not contained in timespan of the current context: " + JSON.stringify({ outer, node }, undefined, 2))
        }
    }

    outer.children.push(node)
}

/**
 * A method decorator factory that wraps the method in a call to 'measure' with 'name' being the method identifier.
 * @returns The decorator
 */
export function alwaysMeasure() {
    return function <B, F extends (...a: any[]) => Promise<B>>(target: any, name: string, descriptor: TypedPropertyDescriptor<F>) {
        const inner = descriptor.value!
        descriptor.value = (async function (...args: any[]) {
            // Figure out a better way to type this
            // @ts-ignore
            const _this = this
            const [_ret, _] = await measure(name, () => inner.apply(_this, args))
            return _ret
        }) as unknown as F
    }
}

/**
 * Transform the current execution-path into a new node under the current context.
 * Only use this if you know what you are doing and can't use 'measure'.
 * 
 * You also MUST close the TimingNode by calling the function returned by 'explicitEnter'. 
 * Failure to do so, or even worse calling two functions returned from 'explicitEnter' in the wrong order,
 * will render your measurements into a complete mess.
 * @param name The name of the TimingNode entry
 * @returns A function that when called "closes" the TimingNode and restores the original context from when the corresponding 'explicitEnter' was called. 
 */
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