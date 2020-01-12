CREATE TABLE weather
(
    id SERIAL PRIMARY KEY,
    location VARCHAR(255),
    timestamp VARCHAR(255),
    temp VARCHAR(255),
    feels_like VARCHAR(255),
    wind_speed VARCHAR(255),
    humidity VARCHAR(255),
    conditions VARCHAR(255)
)