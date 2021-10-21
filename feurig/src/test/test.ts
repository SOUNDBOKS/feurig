
import * as assert from "assert"

import { alwaysMeasure, explicitEnter, insertTimingNode, measure, TimingNode } from "../"


function depth(node: TimingNode): number {
    if (node.children.length) {
        return depth(node.children[0]) + 1
    } else {
        return 1
    }
}

describe("Basics", () => {
    it("should handle recursion", async () => {
        async function fib(i: number): Promise<void> {
            if (i >= 10) return;

            measure("fib " + i, () => fib(i + 1))
        }

        const [_, timings] = await measure("fib", fib.bind(undefined, 1))

        assert.strictEqual(depth(timings), 10)
        assert.strictEqual(timings.name, "fib")
    })

    it("should handle explicit enter", async () => {
        const end = explicitEnter("root")

        await measure("a", async () => {})
        await measure("b", async () => {})

        const timing = end()

        assert.strictEqual(timing.name, "root")
        assert.strictEqual(timing.children.length, 2)
    })

    it("should handle multiple explicit enters", async () => {
        const end1 = explicitEnter("root")
        const end2 = explicitEnter("inner")

        await measure("normal", async () => {})

        const timing2 = end2()
        const timing1 = end1()

        assert.strictEqual(timing1.name, "root")
        assert.strictEqual(timing2.name, "inner")
        assert.strictEqual(timing2.children[0].name, "normal")
        assert.strictEqual(timing1.children[0].name, "inner")
    })

    it("should throw when resolving explicit enters in wrong order", async () => {
        const end = explicitEnter("root")
        const _ = explicitEnter("inner")
        
        assert.throws(end)
    })
})



class Decorated {
    @alwaysMeasure()
    async fib(i: number) {
        assert(this instanceof Decorated)
        if (i == 1) return;
        this.fib(i - 1)
    }
}

describe("Decorators", () => {
    it("should preserve 'this' in a decorated context", async () => {
        const d = new Decorated()
        const [_, timings] = await measure("root", () => d.fib(1))

        assert.strictEqual(timings.children[0].name, "fib")
    })

    it("should handle recursion without problems", async () => {
        const d = new Decorated()
        const [_, timings] = await measure("root", () => d.fib(10))

        assert.strictEqual(depth(timings), 11) // 10 + root
    })
})

describe("Manual inserts", () => {
    it("should throw when trying to insert a node without a context", async () => {
        assert.throws(() => insertTimingNode({
            name: "",
            start: 0,
            end: 100,
            children: []
        }))
    })
    
    it("should throw when trying to insert a node that finishes before it start", async () => {
        const end = explicitEnter("root")

        assert.throws(() => insertTimingNode({
            name: "",
            start: performance.now(),
            end: 0,
            children: [],
        }))

        const _ = end()
    })

    it("should throw when trying to insert a node not contained in the outer context", async () => {
        const end = explicitEnter("root")

        assert.throws(() => insertTimingNode({
            name: "",
            start: 0,
            end: performance.now(),
            children: []
        }), "start is in the past")


        assert.throws(() => insertTimingNode({
            name: "",
            start: 0,
            end: performance.now() + 1000,
            children: [],
        }), "end is in the future")

        const _ = end()
    })

    it("should actually attach a node", async () => {
        const end = explicitEnter("root")
        const node = {
            name: "",
            start: performance.now(),
            end: performance.now(),
            children: [],
        }

        insertTimingNode(node)

        const timings = end()
        assert.deepStrictEqual(timings.children[0], node)
    })
})