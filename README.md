# Eurotravel
**Web Fundamentals**  
**2nd Year - Software Engineering Degree**  
**Project 2025 – 2026**


##  Development Team
| Nombre                           | Email                                          | Github Username                         |
|----------------------------------|------------------------------------------------|-----------------------------------------|
| **Raúl Martín Sánchez**          | [r.martinsa.2024@alumnos.urjc.es](mailto:r.martinsa.2024@alumnos.urjc.es) | [@raulmrtnsa](https://github.com/raulmrtnsa) |
| **Stanislaw Cherkhavskyy Pater** | [s.cherkhavskyy.2024@alumnos.urjc.es](mailto:s.cherkhavskyy.2024@alumnos.urjc.es) | [@stann15](https://github.com/stann15)   |
| **Daniel Villalón Muñoz**        | [d.villalon.2024@alumnos.urjc.es](mailto:d.villalon.2024@alumnos.urjc.es)   | [@DanielVM6](https://github.com/DanielVM6) |

## Features 

### Entities
  
#### Main entity

##### Trip 
We plan to offer a trip as base structure of our webpage selling them appart and as pack with all included. Our idea is to have a static page where the trips with all the atributtes remain the same through out all the times that people enter. The only difference is the availability, we can change it from yes to no and that way the the site will have functionality at the same time remaning simple. The relation wth the secondary one is when they have selected the trip, extra activities will pop up in order tto th costumer to buy it.

##### Attributes:
- **ID** (ID)
- **Main city**  (main_city)
- **Duration** (duration)  
- **Total Price** (price)   
- **Availability** (availability)
- **Type of trip** (t_trip) (family, leisure or cultural) 
- **Flight** (flight) (boolean)
- **National** (national) (boolean)
- **Max travellers** (max_travellers) This is the maximum number of people can choose to do this activity.
  
#### Secondary entity

##### Activity
There will be activities that you could book and add to you trip, this activities will be added to your trip and you could see the caracteristics and information of each them before booking it.

##### Attributes:
- **Name** This is the name of each that each trip offers, as it is static we plan to add one or two activities by trip. 
- **Fee** This is an aditional price aded to the price of the trip.  
- **Time span**  It indicates in the trip what is the lenght, start and end of the activity. 
- **Information** Here we describe what the trip is about.
  
### Images
Each entity or secondary entity will have an associated image so that the user can have an idea of ​​the type of trip or activity he is going to do.

### Search, Filtering, and Categorization

The system will allow:

- **Trip search** by:
  - Main city
  - Dates
  - Type of trip (family, leisure, cultural)
- **Filters**:
  - Price range
  - Duration (days)
  - Available seats
- **Categorization**:
  - National vs international trips  
  - Packages with or without flights  
  - Family, leisure or cultural


