import React from "react"
import { useContext } from "react"
import { TimelineNode, TimelineSettings } from "."


let settingsContext: React.Context<TimelineSettings>

export const useSettingsProvider = (value: TimelineSettings) => {
    settingsContext = React.createContext(value)
    return settingsContext
}

export const useSettings = () => {
    return useContext(settingsContext)
}

export function useClassNames(className: string): string;
export function useClassNames(className: (string | object)[]): string;

export function useClassNames(classNames: ((string | object)[]) | string): string {
    const settings = useSettings()

    if (typeof classNames == "string") {
        return settings.classPrefix + classNames
    }

    return classNames.map(c => {
        if (typeof c == "string") return useClassNames(c)

        return Object.keys(c).map(k => {
            if ((c as any)[k]) return useClassNames(k)
            else return ""
        }).join(" ")
    }).join(" ")
}

export function calculateOverlap(nodes: TimelineNode[]) {
    if (nodes.length <= 1) return false

    const sorted = nodes.sort((a, b) => a.start - b.start)

    for(let i = 1; i < nodes.length; i++) {
        let [last, current] = [nodes[i - 1], nodes[i]]
        if (last.end < current.start) return true
    }

    return false
}

export function useOuterWidth() {
    const settings = useSettings()
    return settings.data.end - settings.data.start
}

export function useMetrics(node: TimelineNode) {
    const outerWidth = useOuterWidth()
    const nodeWidth = node.end - node.start

    const absoluteOffset = (node.start - useSettings().data.start) / outerWidth

    return {
        relativeWidth: nodeWidth / outerWidth,
        absoluteOffset,
        childrenAreSynchronous: calculateOverlap(node.children),
    }
}