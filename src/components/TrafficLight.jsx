import React from 'react'

const TrafficLight = ({ dangerLevel }) => {
  return (
    <div className="traffic-light">
      <div className="traffic-light-title">Semáforo de Peligro</div>
      <div className="lights">
        <div className={`light ${dangerLevel === 'safe' ? 'green' : 'inactive'}`}></div>
        <div className={`light ${dangerLevel === 'warning' ? 'yellow' : 'inactive'}`}></div>
        <div className={`light ${dangerLevel === 'danger' ? 'red' : 'inactive'}`}></div>
      </div>
    </div>
  )
}

export default TrafficLight