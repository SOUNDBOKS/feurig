# feurig
A nodejs application-level performance monitoring library

### What? Why?! HOW?!?!

Feurig lets you do application-level monitoring of the runtime of your program, by simply wrapping code you want measured in a call to Feurig.measure. Feurig automatically reconstructs a kind of callstack from the calls to measure and generates a hierarchical timeline of your program. Importantly it is able to maintain that callstack relationship even in heavily asynchronous context. This is all made possible by the async_hooks feature in NodeJS and more specfically AsyncLocalStorage, which allows us to get a kind of "thread-local" for your async execution context. It just works.  

As for why: Because I was amazed noone has done this yet and I need it.

### Usage

Feurig exports one method `measure`. You pass it a callback which is immediately invoked and internally awaited on. You can get the return value of your callback as the first element returned by measure. The second element is a `TimingNode` which represents the entire call-tree that happened within that callback.  
At the very top-level of your project (or where ever you want really) you just wrap your application code in a measure block and save the `TimingNode` to a file. Donezo.

#### Example
```ts
import * as Feurig from "@soundboks/feurig"

async function sleep(ms: number) {
    await new Promise(resolve => setTimeout(resolve, ms))
}

let feurig = Feurig.measure("app", async () => {
    await Promise.all(([2, 7, 0, 1, 8, 2, 7]).map(async e => {
        await Feurig.measure("A and B" + e, async () => {
            await Feurig.measure("A" + e, async () => await sleep(Math.random() * 1000))
            await sleep(Math.random() * 200)
            await Feurig.measure("B" + e, async () => {
                await Feurig.measure("B delay" + e, async () => await sleep(50))
                await sleep(Math.random() * 1000)
            })
        })
    }))
})

feurig.then(([_, timings]) => {
    const output = {
        rootNode: timings,
        start: timings.start,
        end: timings.end,
    }

    writeFile("flame.json", JSON.stringify(output), () => null)
})
```

### Contributing
Idk. just write me I guess. No promises.
