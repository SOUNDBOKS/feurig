import { AsyncLocalStorage } from "async_hooks"
import { performance } from "perf_hooks"

const asyncStorage = new AsyncLocalStorage();
    
export const measure = async (name: string, cb: () => any) => {
    let node = { name, children: [], start: performance.now(), end: undefined }
    

    await asyncStorage.run(node, cb)
    node.end = performance.now()

    if (asyncStorage.getStore()) {
        (asyncStorage.getStore() as any).children.push(node)
        return asyncStorage.getStore()
    } {
        return node
    }
}