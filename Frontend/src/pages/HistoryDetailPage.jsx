// PLACEHOLDER ONLY for now — real detail view is Module 6.
// Use useParams() from 'react-router-dom' to read the :id route param
// Render <h1>History Detail: {id}</h1> inside a div with p-6 padding.
// Default export function HistoryDetailPage()

import { useParams } from 'react-router-dom'

const HistoryDetailPage = () => {
  const { id } = useParams()

    return (    

    <div className="p-6">
        <h1 className="text-2xl font-bold">History Detail: {id}</h1>
    </div>
  )
}   

export default HistoryDetailPage