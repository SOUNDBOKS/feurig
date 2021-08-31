import * as ReactDOM from "react-dom"
import * as React from "react"
import { HierarchicalTimeline } from "../lib"

import "./styles.scss"

import data from "./testdata.json"

ReactDOM.render(
    <React.StrictMode>
        <HierarchicalTimeline data={data as any} />
    </React.StrictMode>,
    document.getElementById('root')
  )
  