import * as React from 'react'
import { useClassNames, useMetrics, useSettings, useSettingsProvider } from './util'


export interface TimelineNode {
    start: number
    end: number
    name: string
    children: TimelineNode[]
}


export interface TimelineData {
    rootNode: TimelineNode
    start: number
    end: number
}

export interface TimelineSettings {
    classPrefix: string
    data: TimelineData
}

export interface TimelineProps {
    classPrefix?: string
    data: TimelineData
}

export interface TimelineNodeProps {
    node: TimelineNode
    depth?: number
    accumulatedOffset?: number
}

const TimelineNode = ({node, depth = 0, accumulatedOffset = 0 }: TimelineNodeProps) => {
    const metrics = useMetrics(node)
    const style: React.CSSProperties = {
        width: (metrics.relativeWidth * 100) + "vw",
        marginLeft: (metrics.absoluteOffset - accumulatedOffset) * 100 + "vw",
    }

    return <div style={style} className={useClassNames("timeline-node")}>
        <div className={useClassNames("timeline-node-header")}>
            { node.name }
        </div>
        <div className={useClassNames(["timeline-node-children", { "is-synchronous": metrics.childrenAreSynchronous }])}>
            { node.children.map((child, i) => {
                let _accumulatedOffset = accumulatedOffset
                if (metrics.childrenAreSynchronous) {

                    let childMetrics = useMetrics(child)
                    accumulatedOffset = childMetrics.absoluteOffset + childMetrics.relativeWidth
                }
                return <TimelineNode accumulatedOffset={_accumulatedOffset} key={i} node={child} depth={depth + 1}/>
            }) }
        </div>
    </div>
}


export const HierarchicalTimeline = (props: TimelineProps) => {
    const settings: TimelineSettings = {
        data: props.data,
        classPrefix: props.classPrefix || "hrt-"
    }

    const SettingsContext = useSettingsProvider(settings)

    return <SettingsContext.Provider value={settings}>
        <div className={useClassNames("timeline")}>
            <TimelineNode node={settings.data.rootNode} />
        </div>
    </SettingsContext.Provider>
}