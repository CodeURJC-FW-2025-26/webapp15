# Travel Agency 

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
- **ID** Each trip has a unique identification number.
- **Destination**  When the client clicks, he will find a range of cities where he can choose. Every one has an image that corresponds and you can find the links down below.The cities are New York, London, Tokyo, Paris, Shangai, Valencia, Buenos Aires, Cape Town and Sydney. Our plan is to have it writen in big letters in the center.
- **Duration** This atribute describes the lenght of the trip in days.  
- **Total Price** The amount o be paid for the service.   
- **Availability** If there is space to book it or not it tells hich trips are actv or not, marking it by a yes or not.
- **Type of trip** (family, leisure or cultural) This attribute defines the kind of trip you choose.
  
#### Secondary entity

##### Activities
There will be activities that you could book and add to you trip, this activities will be added to your trip and you could see the caracteristics and information of each them before booking it.

##### Attributes:
- **Name** This is the name of each that each trip offers, as it is static we plan to add one or two activities by trip. 
- **Fee** This is an aditional price aded to the price of the trip.  
- **Time span**  It indicates in the trip what is the lenght, start and end of the activity. 
- **Information** Here we describe what the trip is about.
- **Max travellers** This is the maximum number of people can choose to do this activity.
  
### Images
Each entity or secondary entity will have an associated image so that the user can have an idea of ​​the type of trip or activity he is going to do.

### Search, Filtering, and Categorization

The system will allow:

- **Trip search** by:
  - Destination
  - Dates
  - Type of trip (family, leisure, cultural, etc.)
- **Filters**:
  - Price range
  - Duration (days)
  - Available seats
- **Categorization**:
  - National vs international trips  
  - Packages with or without flights  
  - Adventure, family ,leisure 


