import { AsyncLocalStorage } from "async_hooks"
import { performance } from "perf_hooks"

const asyncStorage = new AsyncLocalStorage();

export interface TimingNode {
    start: number
    end: number
    children: TimingNode[]
}

export async function measure<T>(name: string, cb: () => Promise<T>): Promise<[T, TimingNode]> {
    let node = { name, children: [], start: performance.now(), end: undefined }
    
    let ret = await asyncStorage.run(node, cb)
    node.end = performance.now()
    
    if (asyncStorage.getStore()) {
        (asyncStorage.getStore() as any).children.push(node)
        return [ret, asyncStorage.getStore() as TimingNode]
    } {
        return [ret, node]
    }
}
