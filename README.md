Para Completar por grupo

🌐 Koin

Koin es una aplicación web intuitiva diseñada para ayudar a las familias a gestionar sus finanzas de manera eficiente. Permite crear presupuestos, registrar ingresos y gastos, establecer metas financieras y visualizar reportes, tanto a nivel familiar como individual, facilitando la toma de decisiones económicas informadas.

👥 Integrantes

Daniel Andrés Navia Boyacá – 1202517
Juan Diego Quintero  Hernandez – 1202709
Diego Alejandro Yate Girlado - 1202525

🎯 1. Objetivo General

El objetivo de este sistema es desarrollar una página web intuitiva y fácil de entender que permita gestionar de manera eficiente el presupuesto tanto del núcleo familiar como de cada uno de sus miembros de forma individual, integrando funcionalidades como la creación de presupuestos, el registro de ingresos y gastos, y el establecimiento de metas y objetivos financieros; de esta manera, se busca solucionar la dificultad que muchas familias enfrentan al momento de organizar, controlar y visualizar su dinero, evitando desorden financiero, gastos innecesarios y falta de planificación, al ofrecer una herramienta clara, accesible y centralizada que facilite la toma de decisiones económicas informadas.

🌍 2. Contexto de Uso

El sistema está dirigido principalmente a familias que deseen tener un mayor control sobre sus finanzas, incluyendo tanto al núcleo familiar en conjunto como a cada uno de sus integrantes de manera individual, sin importar su nivel de conocimiento financiero; su uso se basa en una plataforma web intuitiva donde los usuarios podrán registrar ingresos y gastos, crear y ajustar presupuestos, y definir metas u objetivos financieros, permitiéndoles consultar y actualizar la información de forma constante para llevar un seguimiento claro de su situación económica y tomar decisiones informadas en su día a día.

📋 3. Requerimientos del Sistema
3.1 Requerimientos Funcionales

1 Registro de usuario
El sistema debe permitir a los usuarios crear una cuenta mediante correo electrónico y contraseña.
2 Inicio de sesión
El sistema debe permitir a los usuarios iniciar sesión de forma segura con sus credenciales.
3 Registro de ingresos
El sistema debe permitir al usuario registrar sus ingresos, especificando monto, fecha, categoría y
descripción.
4 Registro de gastos
El sistema debe permitir al usuario registrar sus gastos, especificando monto, fecha, categoría y
descripción.
5 Creación de presupuestos
El sistema debe permitir crear y gestionar presupuestos para el núcleo familiar y miembros individuales.
6 Establecimiento de metas financieras
El sistema debe permitir definir y seguir metas y objetivos financieros.
7 Edición y eliminación de registros
El sistema debe permitir modificar y eliminar ingresos y gastos previamente registrados.
8 Visualización de historial financiero
El sistema debe mostrar una lista organizada de todos los ingresos y gastos registrados.
9 Clasificación por categorías
El sistema debe permitir clasificar los movimientos en categorías como vivienda, transporte,
alimentación, servicios, entre otros.
10 Generación de reportes visuales
El sistema debe generar gráficos (barras, pastel u otros) que representen ingresos, gastos y balance
financiero.
11 Cálculo automático del balance
El sistema debe calcular automáticamente el balance total (ingresos menos gastos).
12 Proyección financiera
El sistema debe generar proyecciones financieras futuras basadas en los datos registrados.
13 Recomendaciones con Inteligencia Artificial
El sistema debe proporcionar recomendaciones financieras basadas en los hábitos de gasto del
usuario.
14 Acceso desde diferentes dispositivos
El sistema debe permitir el acceso desde computadoras, tablets y teléfonos móviles mediante un
navegador web.
15 Gestión familiar
El sistema debe permitir que varios miembros de una familia registren y consulten información
financiera compartida.
16 Alertas financieras
El sistema debe mostrar alertas cuando los gastos superen los ingresos o el presupuesto establecido.

3.2 Requerimientos No Funcionales

1 – Usabilidad
El sistema debe tener una interfaz intuitiva y fácil de usar para usuarios sin conocimientos técnicos.
2 – Accesibilidad
El sistema debe ser accesible desde cualquier navegador web moderno (Chrome, Edge, Firefox,
Safari).
3 – Rendimiento
El sistema debe cargar las páginas principales en un tiempo máximo de 3 segundos.
4 – Seguridad
El sistema debe proteger la información del usuario mediante autenticación segura y protección de
datos.
5 – Disponibilidad
El sistema debe estar disponible al menos el 99% del tiempo.
6 – Compatibilidad
El sistema debe funcionar correctamente en dispositivos móviles y de escritorio.
7 – Escalabilidad
El sistema debe poder soportar el aumento de usuarios sin afectar el rendimiento.
8 – Confidencialidad
El sistema debe garantizar que solo los usuarios autorizados puedan acceder a su información
financiera.
9 – Mantenibilidad
El sistema debe estar diseñado de forma que permita realizar actualizaciones y mejoras fácilmente.
10 – Integridad de datos
El sistema debe garantizar que los datos registrados no se pierdan ni se alteren incorrectamente.

🧠 4. Diagramas UML

Casos de uso

<img width="1329" height="474" alt="image" src="https://github.com/user-attachments/assets/204b886a-d29d-4e7d-8844-f2a6ff7b6c6b" />

El diagrama muestra de forma general cómo interactúan los diferentes usuarios y componentes del sistema de gestión financiera familiar. Se identifican tres actores principales: el usuario administrador, el miembro familiar y un sistema de inteligencia artificial. Cada uno tiene acceso a distintas funcionalidades, como iniciar sesión, registrar ingresos y gastos, definir presupuestos y consultar reportes. Además, el sistema de IA se encarga de generar predicciones y enviar alertas, apoyando la toma de decisiones. En conjunto, el diagrama representa el flujo de acciones y responsabilidades dentro de la plataforma.

Diagrama de Secuencia

<img width="1233" height="660" alt="image" src="https://github.com/user-attachments/assets/c9adc2e9-f849-4ac7-8a0f-becadef79af4" />

El diagrama de secuencia muestra el flujo de interacción entre los diferentes componentes del sistema cuando un usuario registra un gasto. Inicia con el usuario ingresando los datos en la interfaz, la cual envía la información al backend; luego, el backend guarda el gasto en la base de datos y recibe una confirmación. Posteriormente, se actualiza la vista en la interfaz y el backend puede solicitar un análisis al sistema de inteligencia artificial, que devuelve un resultado. Finalmente, el sistema envía un mensaje de éxito al usuario, reflejando todo el proceso desde la entrada de datos hasta la respuesta final.

🎨 5. URL del Prototipo
https://www.figma.com/design/nXIDgMfFZrDOzF1dfZDNji/Referencias-p%C3%A1gina-finanzas?node-id=0-1&t=N3C41PjpP2LwmNPC-1


🗄️ 6. Diseño de Base de Datos

<img width="1182" height="573" alt="image" src="https://github.com/user-attachments/assets/a588170a-af73-4a28-bf07-5bd1ea69dbe5" />


🧩 7. Documentación del Sistema
Estructura de Carpetas
/css: Contiene los archivos CSS para el estilo de la aplicación, como styles.css.
/js: Contiene los archivos JavaScript que manejan la lógica de la aplicación, incluyendo módulos para autenticación, renderizado del dashboard, almacenamiento, etc.
/assets: Contiene recursos estáticos como imágenes, íconos u otros medios utilizados en la aplicación.
/Components: Contiene componentes HTML para diferentes secciones de la aplicación, como login, registro, transacciones, etc.

🚀 8. Instalación y Ejecución

El proyecto ya no se ejecuta solo abriendo `index.html`. Ahora tiene un backend Express y una base de datos PostgreSQL.

Requisitos:

- Node.js 20 o superior
- Una base de datos PostgreSQL, idealmente en Supabase

Variables de entorno necesarias:

- `DATABASE_URL`: cadena de conexión de Supabase/PostgreSQL
- `DATABASE_SSL`: usa `require` para Supabase
- `JWT_SECRET`: secreto para firmar tokens
- `FRONTEND_URL`: URL pública del frontend, por ejemplo `https://tu-app.vercel.app`

Pasos de arranque local:

1. Instala dependencias con `npm install`
2. Configura las variables de entorno
3. Ejecuta el esquema con `npm run db:schema`
4. Si deseas migrar datos locales desde `.data/db.json`, ejecuta `npm run db:import-lowdb`
5. Inicia el servidor con `npm run dev`
6. Abre `http://localhost:3000`

🌩️ 9. Despliegue Recomendado

Arquitectura objetivo:

- Supabase: PostgreSQL
- Render: backend y API Express
- Vercel: frontend estático

Render:

- Usa el archivo `render.yaml`
- Define `DATABASE_URL`, `DATABASE_SSL`, `FRONTEND_URL` y `JWT_SECRET`
- El health check es `/health`

Vercel:

- Usa el archivo `vercel.json`
- Define `APP_API_BASE_URL` con la URL pública del backend en Render
- Vercel construirá el frontend estático en `dist/`

🗃️ 10. Esquema y Migración

- El esquema SQL base está en `database/schema.sql`
- El script `scripts/apply-schema.mjs` aplica ese esquema
- El script `scripts/import-lowdb.mjs` importa los datos históricos de `.data/db.json`
