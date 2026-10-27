# Lista de ejemplo para "Cargar lista de usuarios"

`lista_servicios_escolares_2026-2.csv` (también acepta .xlsx con las mismas columnas)
trae 3 renglones válidos y 3 con errores para ver todos los estados de la pantalla:

| Renglón | Resultado esperado |
|---|---|
| andrea.salinas, bruno.cantu, carla.mendez | Válidos: se crean con contraseña inicial = matrícula a 10 dígitos |
| daniel.ibarra (31300AB) | Formato inválido: solo se permiten números |
| elena.vazquez (sin nombre) | Dato incompleto: el nombre está vacío |
| marcela.guerra (3105843) | Ya existe una cuenta con esta matrícula |

Para "Bajas por lista" se puede usar una lista con 3105843 (se da de baja) y
3120558 (luis.moreno: se rechaza por tener un préstamo y multa pendiente).
