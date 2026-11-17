-- =====================================================================
-- Biblioteca Ducky - Datos semilla (tomados del prototipo de Figma)
-- Contraseña de todos los usuarios de prueba: Ducky2026!
-- =====================================================================
SET NAMES utf8mb4;
USE biblioteca_ducky;

-- Perfiles -----------------------------------------------------------
INSERT INTO Perfiles (id_perfil, Nombre_Rol, Descripcion_Perfil) VALUES
  (1, 'Administrador', 'Acceso completo al sistema.'),
  (2, 'Bibliotecario', 'Préstamos, devoluciones, multas y búsqueda de libros.'),
  (3, 'Profesor', 'Búsqueda de libros en el catálogo.'),
  (4, 'Alumno', 'Búsqueda de libros en el catálogo.'),
  (5, 'Colaborador', 'Búsqueda de libros en el catálogo.');

-- Funciones. Nombre_Funcion es el código que revisa la API; la etiqueta
-- visible va en Descripcion_Funcion con el formato 'Etiqueta: descripción'.
-- Son las seis funciones del diagrama de funciones (una por módulo).
INSERT INTO Funciones (id_funcion, Nombre_Funcion, Descripcion_Funcion) VALUES
  (1, 'gestionar_usuarios', 'Gestión de usuarios: Alta, baja, cambio y consulta de usuarios, y gestión de perfiles.'),
  (2, 'gestionar_libros', 'Gestión de libros: Alta, baja, cambio y consulta de libros, solicitud de compra y listado.'),
  (3, 'buscar_libros', 'Búsqueda de libros: Buscar en el catálogo con filtros y ver el detalle de los libros.'),
  (4, 'prestar_libros', 'Préstamo de libros: Registro, recibo y renovación de préstamos, y lista de espera.'),
  (5, 'devolver_libros', 'Devolución de libros: Devoluciones, libros perdidos, multas, adeudos y pagos.'),
  (6, 'usar_asistente', 'Asistente Biblio: Preguntas frecuentes sobre el sistema según el perfil.');

-- El Administrador tiene todas; el Bibliotecario presta, recibe devoluciones y
-- maneja multas; todos buscan libros y usan el Asistente Biblio.
INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (4, 1),
  (5, 1),
  (6, 1),
  (3, 2),
  (4, 2),
  (5, 2),
  (6, 2),
  (3, 3),
  (6, 3),
  (3, 4),
  (6, 4),
  (3, 5),
  (6, 5);

-- Usuarios -----------------------------------------------------------
-- Correo y Telefono son los de CIAA o Empleados (externos/database).
SET @hash = '$2b$10$63TcTHQUM5MCxcb1X6BqGeYK3IEWv.Sb0af27V3uvvaBW1ugkPg56';
INSERT INTO Usuarios (id_usuario, Nombre_Usuario, Contrasena_Usuario, Matricula_Nomina, id_perfil, Nombre_Completo, Correo, Telefono, Estatus) VALUES
  (1, 'felipe.rodriguez', @hash, '1001133', 1, 'Felipe Rodríguez', 'felipe.rodriguez@ducky.edu.mx', '8113000001', 'Activo'),
  (2, 'catherine.ramirez', @hash, '2004720', 2, 'Catherine Ramírez', 'catherine.ramirez@ducky.edu.mx', '8113000002', 'Activo'),
  (3, 'javier.saavedra', @hash, '1987345', 3, 'Javier Saavedra', 'javier.saavedra@ducky.edu.mx', '8113000003', 'Activo'),
  (4, 'marcela.guerra', @hash, '3105843', 4, 'Marcela Guerra', 'marcela.guerra@ducky.edu.mx', '8112345601', 'Activo'),
  (5, 'cesar.rodriguez', @hash, '2005872', 5, 'César Rodríguez', 'cesar.rodriguez@ducky.edu.mx', '8182755127', 'Activo'),
  (6, 'diego.fuentes', @hash, '3098117', 4, 'Diego Alberto Fuentes Cano', 'diego.fuentes@ducky.edu.mx', '8112345603', 'Activo'),
  (7, 'maria.ortiz', @hash, '3112390', 4, 'María Fernanda Ortiz Vega', 'maria.ortiz@ducky.edu.mx', '8112345602', 'Activo'),
  (8, 'luis.moreno', @hash, '3120558', 4, 'Luis Ángel Moreno Ríos', 'luis.moreno@ducky.edu.mx', '8112345604', 'Activo'),
  (9, 'hector.villarreal', @hash, '2005871', 5, 'Héctor Villarreal', 'hector.villarreal@ducky.edu.mx', '8113000005', 'Activo'),
  (10, 'ana.lopez', @hash, '3109921', 4, 'Ana López', 'ana.lopez@ducky.edu.mx', '8112345610', 'Activo'),
  (11, 'luis.perez', @hash, '3111456', 4, 'Luis Pérez', 'luis.perez@ducky.edu.mx', '8112345611', 'Activo'),
  (12, 'daniela.cruz', @hash, '3104410', 4, 'Daniela Cruz', 'daniela.cruz@ducky.edu.mx', NULL, 'Activo');

-- Catálogo -----------------------------------------------------------
INSERT INTO Editoriales (id_editorial, Nombre_Editorial, Pais) VALUES
  (1, 'Pearson', 'Reino Unido'),
  (2, 'McGraw-Hill', 'Estados Unidos'),
  (3, 'Addison-Wesley', 'Estados Unidos'),
  (4, 'MIT Press', 'Estados Unidos'),
  (5, 'Prentice Hall', 'Estados Unidos'),
  (6, 'Cengage', 'Estados Unidos'),
  (7, 'Springer', 'Alemania');

INSERT INTO Temas (id_tema, Nombre_Tema, Descripcion) VALUES
  (1, 'Computación', 'Algoritmos, programación y sistemas'),
  (2, 'Redes', 'Redes de computadoras y comunicaciones'),
  (3, 'Matemáticas', 'Cálculo, álgebra y estadística'),
  (4, 'Física', 'Física general y universitaria');

INSERT INTO Autores (id_autor, Nombre, Apellido_Paterno) VALUES
  (1, 'T. H.', 'Cormen'),
  (2, 'R. C.', 'Martin'),
  (3, 'B. W.', 'Kernighan'),
  (4, 'D. M.', 'Ritchie'),
  (5, 'A. S.', 'Tanenbaum'),
  (6, 'J.', 'Stewart'),
  (7, 'M. A.', 'Weiss'),
  (8, 'S. I.', 'Grossman'),
  (9, 'F. W.', 'Sears'),
  (10, 'M. W.', 'Zemansky'),
  (11, 'A.', 'Silberschatz'),
  (12, 'I.', 'Sommerville'),
  (13, 'S.', 'Russell'),
  (14, 'P.', 'Norvig'),
  (15, 'R. E.', 'Walpole'),
  (16, 'A. V.', 'Aho'),
  (17, 'S. S.', 'Skiena'),
  (18, 'P. G.', 'Hewitt'),
  (19, 'W. A.', 'Granville');

INSERT INTO Libros (id_libro, ISBN, Titulo, Anio, Sinopsis, id_editorial, id_usuario, Precio, Estatus) VALUES
  (1, '978-0-262-03384-8', 'Introduction to Algorithms', 2009, 'Referencia integral sobre algoritmos y estructuras de datos: diseño, análisis de complejidad y demostraciones.', 4, 1, 1890.00, 'Activo'),
  (2, '978-0-13-235088-4', 'Clean Code', 2008, 'Guía práctica para escribir código limpio, legible y fácil de mantener.', 1, 1, 899.00, 'Activo'),
  (3, '978-0-13-110362-7', 'El lenguaje de programación C', 1988, 'El texto clásico del lenguaje C, escrito por sus creadores.', 5, 1, 650.00, 'Activo'),
  (4, '978-607-442-046-3', 'Sistemas operativos modernos', 2009, 'Procesos, memoria, sistemas de archivos y seguridad en sistemas operativos actuales.', 1, 1, 980.00, 'Activo'),
  (5, '978-607-32-0817-8', 'Redes de computadoras', 2011, 'Obra de referencia de redes para cursos de licenciatura.', 1, 1, 1050.00, 'Activo'),
  (6, '978-607-481-881-9', 'Cálculo de una variable', 2012, 'Obra de referencia de matemáticas para cursos de licenciatura.', 6, 1, 1150.00, 'Activo'),
  (7, '978-0-13-449416-6', 'Clean Architecture', 2017, 'Principios de arquitectura de software para sistemas mantenibles.', 1, 1, 870.00, 'Activo'),
  (8, '978-84-7829-035-2', 'Estructuras de datos en Java', 2013, 'Estructuras de datos y análisis de algoritmos con Java.', 1, 1, 760.00, 'Activo'),
  (9, '978-607-15-0760-3', 'Álgebra lineal', 2012, 'Obra de referencia de matemáticas para cursos de licenciatura.', 2, 1, 690.00, 'Activo'),
  (10, '978-607-32-4440-4', 'Física universitaria', 2018, 'Obra de referencia de física para cursos de licenciatura.', 1, 1, 1320.00, 'Activo'),
  (11, '978-84-481-9033-5', 'Bases de datos', 2014, 'Fundamentos de diseño, consulta y administración de bases de datos.', 2, 1, 1080.00, 'Activo'),
  (12, '978-607-32-0603-7', 'Ingeniería de software', 2011, 'Procesos, requisitos, diseño, pruebas y evolución del software.', 1, 1, 990.00, 'Activo'),
  (13, '978-84-205-4003-0', 'Inteligencia artificial', 2021, 'Obra de referencia de inteligencia artificial para cursos de licenciatura.', 1, 1, 1400.00, 'Activo'),
  (14, '978-607-32-1417-9', 'Probabilidad y estadística', 2012, 'Obra de referencia de matemáticas para cursos de licenciatura.', 1, 1, 830.00, 'Activo'),
  (15, '978-970-26-1133-2', 'Compiladores', 2008, 'Principios, técnicas y herramientas para construir compiladores.', 1, 1, 940.00, 'Activo'),
  (16, '978-84-7829-085-7', 'Algoritmos y estructuras de datos', 2010, 'Análisis de algoritmos y estructuras de datos fundamentales.', 3, 1, 720.00, 'Activo'),
  (17, '978-3-030-54255-9', 'The Algorithm Design Manual', 2020, 'Diseño práctico de algoritmos con un catálogo de problemas.', 7, 1, 1250.00, 'Activo'),
  (18, '978-970-26-0795-3', 'Física conceptual', 2007, 'Introducción a la física con énfasis en los conceptos.', 1, 1, 540.00, 'Activo'),
  (19, '978-968-18-1178-5', 'Cálculo diferencial (2a ed.)', 1990, 'Edición antigua retirada del acervo por obsolescencia.', 2, 1, 300.00, 'Inactivo');

INSERT INTO AutoresLibros (id_libro, id_autor) VALUES
  (1, 1),
  (2, 2),
  (3, 3),
  (3, 4),
  (4, 5),
  (5, 5),
  (6, 6),
  (7, 2),
  (8, 7),
  (9, 8),
  (10, 9),
  (10, 10),
  (11, 11),
  (12, 12),
  (13, 13),
  (13, 14),
  (14, 15),
  (15, 16),
  (16, 7),
  (17, 17),
  (18, 18),
  (19, 19);

INSERT INTO TemasLibros (id_libro, id_tema) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (4, 1),
  (5, 2),
  (6, 3),
  (7, 1),
  (8, 1),
  (9, 3),
  (10, 4),
  (11, 1),
  (12, 1),
  (13, 1),
  (14, 3),
  (15, 1),
  (16, 1),
  (17, 1),
  (18, 4),
  (19, 3);

-- Ubicacion: código P{pasillo}-E{estante}-N{nivel}-S{sección} (lo genera el sistema).
INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Ubicacion, Motivo_Baja) VALUES
  (1, 1, 'Disponible', 'P4-EB-N2-SComputación', NULL),
  (1, 2, 'Disponible', 'P4-EB-N2-SComputación', NULL),
  (1, 3, 'En préstamo', 'P4-EB-N2-SComputación', NULL),
  (1, 4, 'En préstamo', 'P4-EB-N2-SComputación', NULL),
  (1, 5, 'En préstamo', 'P4-EB-N2-SComputación', NULL),
  (2, 1, 'Disponible', 'P4-EB-N2-SComputación', NULL),
  (2, 2, 'En préstamo', 'P4-EB-N2-SComputación', NULL),
  (2, 3, 'Disponible', 'P4-EB-N2-SComputación', NULL),
  (2, 4, 'Consulta Externa', 'P4-EB-N2-SComputación', NULL),
  (3, 1, 'Disponible', 'P4-EQA76.73-N3-SComputación', NULL),
  (3, 2, 'En préstamo', 'P4-EQA76.73-N3-SComputación', NULL),
  (3, 3, 'Consulta Externa', 'P4-EQA76.73-N3-SComputación', NULL),
  (4, 1, 'En préstamo', 'P5-EQA76.76-N1-SComputación', NULL),
  (4, 2, 'Consulta Externa', 'P5-EQA76.76-N1-SComputación', NULL),
  (4, 3, 'Consulta Externa', 'P5-EQA76.76-N1-SComputación', NULL),
  (4, 4, 'Consulta Externa', 'P5-EQA76.76-N1-SComputación', NULL),
  (5, 1, 'Disponible', 'P4-ETK5105-N2-SRedes', NULL),
  (5, 2, 'Disponible', 'P4-ETK5105-N2-SRedes', NULL),
  (5, 3, 'Consulta Externa', 'P4-ETK5105-N2-SRedes', NULL),
  (5, 4, 'Consulta Externa', 'P4-ETK5105-N2-SRedes', NULL),
  (5, 5, 'En préstamo', 'P4-ETK5105-N2-SRedes', NULL),
  (5, 6, 'Consulta Externa', 'P4-ETK5105-N2-SRedes', NULL),
  (6, 1, 'Disponible', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 2, 'Disponible', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 3, 'Disponible', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 4, 'Consulta Externa', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 5, 'Consulta Externa', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 6, 'En préstamo', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 7, 'Consulta Externa', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 8, 'Consulta Externa', 'P3-EQA303-N3-SMatemáticas', NULL),
  (7, 1, 'Disponible', 'P4-EQA76.76-N2-SComputación', NULL),
  (7, 2, 'Consulta Externa', 'P4-EQA76.76-N2-SComputación', NULL),
  (7, 3, 'Consulta Externa', 'P4-EQA76.76-N2-SComputación', NULL),
  (8, 1, 'Disponible', 'P4-EQA76.73-N1-SComputación', NULL),
  (8, 2, 'Consulta Externa', 'P4-EQA76.73-N1-SComputación', NULL),
  (8, 3, 'Consulta Externa', 'P4-EQA76.73-N1-SComputación', NULL),
  (9, 1, 'Disponible', 'P3-EQA184-N2-SMatemáticas', NULL),
  (9, 2, 'Consulta Externa', 'P3-EQA184-N2-SMatemáticas', NULL),
  (9, 3, 'Consulta Externa', 'P3-EQA184-N2-SMatemáticas', NULL),
  (10, 1, 'Disponible', 'P2-EQC21-N1-SFísica', NULL),
  (10, 2, 'Disponible', 'P2-EQC21-N1-SFísica', NULL),
  (10, 3, 'Consulta Externa', 'P2-EQC21-N1-SFísica', NULL),
  (10, 4, 'Consulta Externa', 'P2-EQC21-N1-SFísica', NULL),
  (11, 1, 'Disponible', 'P5-EQA76.9-N2-SComputación', NULL),
  (11, 2, 'Consulta Externa', 'P5-EQA76.9-N2-SComputación', NULL),
  (11, 3, 'En préstamo', 'P5-EQA76.9-N2-SComputación', NULL),
  (12, 1, 'Disponible', 'P4-EQA76.758-N3-SComputación', NULL),
  (12, 2, 'Consulta Externa', 'P4-EQA76.758-N3-SComputación', NULL),
  (12, 3, 'Consulta Externa', 'P4-EQA76.758-N3-SComputación', NULL),
  (13, 1, 'Disponible', 'P5-EQ335-N1-SComputación', NULL),
  (13, 2, 'Consulta Externa', 'P5-EQ335-N1-SComputación', NULL),
  (13, 3, 'En préstamo', 'P5-EQ335-N1-SComputación', NULL),
  (14, 1, 'Disponible', 'P3-EQA273-N2-SMatemáticas', NULL),
  (14, 2, 'Consulta Externa', 'P3-EQA273-N2-SMatemáticas', NULL),
  (15, 1, 'Disponible', 'P5-EQA76.76-N3-SComputación', NULL),
  (15, 2, 'Consulta Externa', 'P5-EQA76.76-N3-SComputación', NULL),
  (16, 1, 'Consulta Externa', 'P4-EQA76.9-N2-SComputación', NULL),
  (16, 2, 'En préstamo', 'P4-EQA76.9-N2-SComputación', NULL),
  (17, 1, 'En préstamo', 'P4-EQA76.9-N3-SComputación', NULL),
  (17, 2, 'En préstamo', 'P4-EQA76.9-N3-SComputación', NULL),
  (18, 1, 'Disponible', 'P2-EQC23-N2-SFísica', NULL),
  (18, 2, 'Consulta Externa', 'P2-EQC23-N2-SFísica', NULL),
  (19, 1, 'Inactivo', 'P3-EQA303-N1-SMatemáticas', 'Obsoleto');

-- Circulación ---------------------------------------------------------
-- Las fechas son relativas al día en que se carga la semilla, para que siempre
-- haya préstamos al corriente, vencidos, renovados y multas recientes.
SET @hoy = CURRENT_DATE;

-- Préstamos activos: uno por cada copia marcada 'En préstamo'.
--   ana.lopez: un préstamo vencido y multas pendientes (no puede pedir otro).
--   javier.saavedra: un préstamo con las 3 renovaciones de profesor ya usadas.
--   luis.perez: préstamo vencido hace 10 días (aparece en vencidos y deudores).
--   marcela.guerra: tiene «Introduction to Algorithms», que no tiene copias libres.
--   daniela.cruz: no tiene teléfono registrado (el recibo no se puede enviar por WhatsApp).
INSERT INTO Prestamos (id_prestamo, Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia) VALUES
  (1, DATE_SUB(@hoy, INTERVAL 2 DAY), DATE_ADD(@hoy, INTERVAL 5 DAY), 'Activo', 4, 4, 1),
  (2, DATE_SUB(@hoy, INTERVAL 4 DAY), DATE_ADD(@hoy, INTERVAL 3 DAY), 'Activo', 4, 1, 3),
  (3, DATE_SUB(@hoy, INTERVAL 11 DAY), DATE_SUB(@hoy, INTERVAL 4 DAY), 'Activo', 10, 11, 3),
  (4, DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_ADD(@hoy, INTERVAL 6 DAY), 'Activo', 10, 5, 5),
  (5, DATE_SUB(@hoy, INTERVAL 40 DAY), DATE_ADD(@hoy, INTERVAL 12 DAY), 'Activo', 3, 6, 6),
  (6, DATE_SUB(@hoy, INTERVAL 6 DAY), DATE_ADD(@hoy, INTERVAL 8 DAY), 'Activo', 3, 2, 2),
  (7, DATE_SUB(@hoy, INTERVAL 17 DAY), DATE_SUB(@hoy, INTERVAL 10 DAY), 'Activo', 11, 16, 2),
  (8, DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_ADD(@hoy, INTERVAL 4 DAY), 'Activo', 8, 1, 4),
  (9, DATE_SUB(@hoy, INTERVAL 5 DAY), DATE_ADD(@hoy, INTERVAL 2 DAY), 'Activo', 7, 1, 5),
  (10, DATE_SUB(@hoy, INTERVAL 3 DAY), DATE_ADD(@hoy, INTERVAL 4 DAY), 'Activo', 7, 13, 3),
  (11, DATE_SUB(@hoy, INTERVAL 2 DAY), DATE_ADD(@hoy, INTERVAL 5 DAY), 'Activo', 12, 3, 2),
  (12, DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_ADD(@hoy, INTERVAL 6 DAY), 'Activo', 12, 17, 1),
  (13, DATE_SUB(@hoy, INTERVAL 2 DAY), DATE_ADD(@hoy, INTERVAL 5 DAY), 'Activo', 5, 17, 2);

INSERT INTO Renovaciones (id_prestamo, num_prestamo, Fecha_Renovacion, Fecha_Previamente_Programada) VALUES
  (5, 1, DATE_SUB(@hoy, INTERVAL 27 DAY), DATE_SUB(@hoy, INTERVAL 26 DAY)),
  (5, 2, DATE_SUB(@hoy, INTERVAL 13 DAY), DATE_SUB(@hoy, INTERVAL 12 DAY)),
  (5, 3, DATE_SUB(@hoy, INTERVAL 1 DAY), DATE_ADD(@hoy, INTERVAL 2 DAY));

-- Historial: préstamos devueltos (a tiempo y con retraso).
INSERT INTO Prestamos (id_prestamo, Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia) VALUES
  (14, DATE_SUB(@hoy, INTERVAL 40 DAY), DATE_SUB(@hoy, INTERVAL 33 DAY), 'Devuelto', 4, 5, 2),
  (15, DATE_SUB(@hoy, INTERVAL 60 DAY), DATE_SUB(@hoy, INTERVAL 53 DAY), 'Devuelto', 4, 3, 1),
  (16, DATE_SUB(@hoy, INTERVAL 30 DAY), DATE_SUB(@hoy, INTERVAL 23 DAY), 'Devuelto', 10, 2, 4),
  (17, DATE_SUB(@hoy, INTERVAL 14 DAY), DATE_SUB(@hoy, INTERVAL 9 DAY), 'Devuelto', 10, 11, 2),
  (18, DATE_SUB(@hoy, INTERVAL 60 DAY), DATE_SUB(@hoy, INTERVAL 53 DAY), 'Devuelto', 10, 4, 4),
  (19, DATE_SUB(@hoy, INTERVAL 70 DAY), DATE_SUB(@hoy, INTERVAL 63 DAY), 'Devuelto', 8, 12, 1),
  (20, DATE_SUB(@hoy, INTERVAL 25 DAY), DATE_SUB(@hoy, INTERVAL 18 DAY), 'Devuelto', 12, 14, 2),
  (21, DATE_SUB(@hoy, INTERVAL 50 DAY), DATE_SUB(@hoy, INTERVAL 36 DAY), 'Devuelto', 3, 12, 2),
  (22, DATE_SUB(@hoy, INTERVAL 20 DAY), DATE_SUB(@hoy, INTERVAL 13 DAY), 'Devuelto', 4, 5, 2);

INSERT INTO Devoluciones (id_devolucion, id_prestamo, Fecha_Devolucion) VALUES
  (1, 14, DATE_SUB(@hoy, INTERVAL 34 DAY)),
  (2, 15, DATE_SUB(@hoy, INTERVAL 51 DAY)),
  (3, 16, DATE_SUB(@hoy, INTERVAL 19 DAY)),
  (4, 17, DATE_SUB(@hoy, INTERVAL 2 DAY)),
  (5, 18, DATE_SUB(@hoy, INTERVAL 53 DAY)),
  (6, 19, DATE_SUB(@hoy, INTERVAL 59 DAY)),
  (7, 20, DATE_SUB(@hoy, INTERVAL 16 DAY)),
  (8, 21, DATE_SUB(@hoy, INTERVAL 37 DAY)),
  (9, 22, DATE_SUB(@hoy, INTERVAL 10 DAY));

-- Multas. Tesorería ya tiene las 1 a 5 y la 7 (externos/database/03_tesoreria.sql) y
-- registró el pago de la 2, la 3 y la 7 (esta hace 2 días, para que se vea en el
-- filtro «Últimos 7 días» de Pagos de Tesorería). La 6 aún no se le envía: aparece
-- como «Pendiente de sincronizar» en Pagos de Tesorería.
INSERT INTO Multas (id_multa, Cantidad_a_Pagar, Fecha_Pagado, id_usuario, id_prestamo, Justificacion, Motivo, Fecha_Multa, Enviada_Tesoreria) VALUES
  (1, 45.00, NULL, 8, 19, 'Devolución con 4 días de retraso y daño menor en la portada.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 59 DAY), TRUE),
  (2, 20.00, DATE_SUB(@hoy, INTERVAL 45 DAY), 4, 15, 'Devolución con 2 días de retraso.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 51 DAY), TRUE),
  (3, 250.00, DATE_SUB(@hoy, INTERVAL 50 DAY), 10, 18, 'El libro se devolvió con hojas rayadas en el capítulo 4.', 'Daño del libro', DATE_SUB(@hoy, INTERVAL 53 DAY), TRUE),
  (4, 40.00, NULL, 10, 16, 'Devolución con 4 días de retraso.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 19 DAY), TRUE),
  (5, 70.00, NULL, 10, 17, 'Devolución con 7 días de retraso.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 2 DAY), TRUE),
  (6, 20.00, NULL, 12, 20, 'Devolución con 2 días de retraso.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 16 DAY), FALSE),
  (7, 30.00, DATE_SUB(@hoy, INTERVAL 2 DAY), 4, 22, 'Devolución con 3 días de retraso.', 'Entrega extemporánea', DATE_SUB(@hoy, INTERVAL 10 DAY), TRUE);

-- Lista de espera de «Introduction to Algorithms» (sus copias para llevar están prestadas).
INSERT INTO ListaDeEspera (id_lista_espera, Fecha_Peticion, Estatus, id_usuario, id_libro) VALUES
  (1, DATE_SUB(@hoy, INTERVAL 9 DAY), 'Pendiente', 3, 1),
  (2, DATE_SUB(@hoy, INTERVAL 7 DAY), 'Pendiente', 5, 1);

-- Solicitudes de compra ---------------------------------------------
INSERT INTO LibrosNuevos (id_libro_nuevo, ISBN, Titulo, Autor, Editorial, Precio, Anio, Tema, Sinopsis) VALUES
  (1, '978-0-201-10088-4', 'Compilers: Principles, Techniques, and Tools', 'Aho, A. V.', 'Addison-Wesley', 1500.00, 1986, 'Computación', 'El libro del dragón sobre construcción de compiladores.');
-- Las órdenes 2 y 3 ya están en Tesorería (externos/database/03_tesoreria.sql);
-- la 1 y la 4 siguen pendientes de envío y se envían al abrir "Solicitar libros".
INSERT INTO OrdenesCompra (id_orden, id_usuario, Fecha_Orden, Estatus, CantidadTotal) VALUES
  (1, 1, '2026-10-22', 'Pendiente', 2697.00),
  (2, 1, '2026-10-15', 'En revision', 3900.00),
  (3, 1, '2026-10-01', 'Aprobada', 3920.00),
  (4, 1, '2026-10-20', 'Pendiente', 9450.00);
INSERT INTO OrdenLibrosExistentes (id_orden, id_libro, Justificacion, Num_Ejemplares) VALUES
  (1, 2, 'Alta demanda en Ingeniería de Software', 3),
  (2, 3, 'Copias insuficientes para el curso de Programación', 6),
  (3, 4, 'Reposición por desgaste', 4),
  (4, 1, 'Lista de peticiones del periodo', 5);

-- Políticas (reglamento de préstamo que aplica el sistema) --------------
INSERT INTO Politicas (id_politica, Informacion) VALUES
  (1, 'Las copias «Disponible» se consultan dentro de la biblioteca; solo las de «Consulta Externa» se prestan a domicilio.'),
  (2, 'El préstamo dura 5 días hábiles para alumnos y colaboradores y 10 para profesores, sin contar sábados ni domingos.'),
  (3, 'Un préstamo se renueva hasta 2 veces (3 si es de un profesor). Si ya estaba vencido, se cobra la multa por los días de retraso.'),
  (4, 'Para pedir un libro el lector debe estar activo, sin multas pendientes, sin préstamos vencidos y con menos de 2 préstamos.'),
  (5, 'Multas: $10.00 por día de retraso, $250.00 por daño y el precio de la última compra si el libro se pierde.'),
  (6, 'En la lista de espera tiene prioridad el primero que se registró; no se envían notificaciones.');

-- Asistente Biblio ------------------------------------------------------
-- Cada respuesta cita el artefacto del proyecto del que se tomó (Sprint Review).
INSERT INTO FuentesChatbot (id_fuente, Fuente) VALUES
  (1, 'Propuesta de Negocio · Objetivo del proyecto'),
  (2, 'Propuesta de Negocio · Alcance'),
  (3, 'Propuesta de Negocio · Tecnología y hardware'),
  (4, 'Historia de usuario BD-SP02-BL01 · Existencia y ubicación'),
  (5, 'Historia de usuario BD-SP03-PL03 · Registro de préstamo'),
  (6, 'Historia de usuario BD-SP03-DL01 · Registro de devolución'),
  (7, 'Historia de usuario BD-SP01-GU02 · Usuarios y perfiles'),
  (8, 'Historia de usuario BD-SP02-GL01 · Registrar libros y copias');

-- id_funcion: 6 = todos los perfiles; 4 y 5 = préstamos y devoluciones
-- (Bibliotecario y Administrador); 1 y 2 = solo el Administrador.
INSERT INTO PreguntasChatbot (id_pregunta, Pregunta, id_funcion) VALUES
  (1, '¿Cuál es el objetivo de Biblio?', 6),
  (2, '¿Qué alcance tiene Biblio?', 6),
  (3, '¿En qué plataformas puedo usar Biblio?', 6),
  (4, '¿Cómo busco un libro?', 6),
  (5, '¿Cómo registro un préstamo?', 4),
  (6, '¿Cómo registro una devolución?', 5),
  (7, '¿Cómo doy de alta a un usuario?', 1),
  (8, '¿Cómo registro un libro nuevo?', 2);

INSERT INTO ContenidosChatbot (id_contenido, Respuesta, id_pregunta, id_fuente) VALUES
  (1, 'Biblio es el sistema de la Biblioteca de la Universidad Ducky. Su objetivo es gestionar en una plataforma web y móvil los usuarios, los libros, los préstamos, las multas y un asistente virtual, para reducir el tiempo de atención en un 50 % y mantener el catálogo 100 % actualizado.', 1, 1),
  (2, 'Biblio cubre seis funciones: gestión de usuarios (autenticación, altas, bajas, cambios y perfiles), gestión de libros (fichas, copias, solicitudes de compra y listados), búsqueda de libros, préstamos (validación, recibo, renovación y lista de espera), devoluciones con multas y este Asistente Biblio.', 2, 2),
  (3, 'Puedes usar Biblio en el sitio web desde una computadora o laptop, y en la aplicación móvil para iOS y Android. Las dos se conectan por HTTPS al mismo servidor en Google Cloud, así que ves la misma información en ambas.', 3, 3),
  (4, 'Entra a Catálogo (en la web) o a Inicio y Buscar (en la app) y escribe el título, el autor, el tema, la editorial o el ISBN. El filtro que elijas también ordena los resultados. En la ficha ves cuántas copias hay disponibles y en qué pasillo están. Los préstamos se piden en el mostrador.', 4, 4),
  (5, 'Ve a Préstamos → Registrar préstamo. Busca al lector por matrícula o número de nómina, después el libro por su ISBN y elige el ejemplar. El sistema revisa que el lector no tenga multas ni libros vencidos y que tenga menos de 2 préstamos, y calcula la devolución: 5 días hábiles para alumnos y colaboradores, y 10 para profesores. Luego entregas el recibo.', 5, 5),
  (6, 'Ve a Devoluciones → Registrar devolución, busca al lector por matrícula o número de nómina y elige el préstamo. Al registrarla, la copia vuelve a estar disponible. Si se entrega después de la fecha, se genera una multa de $10.00 por día de retraso, y si hay lectores en la lista de espera el sistema te dice quién tiene prioridad.', 6, 6),
  (7, 'Ve a Usuarios → Actualizar lista de usuarios. Biblio consulta las listas de CIAA (alumnos) y de Empleados y te muestra a quienes aún no tienen cuenta, con el rol sugerido. Revisa el rol de cada persona y confirma: el usuario es nombre.apellido y la contraseña inicial es 000 seguido de la matrícula o nómina.', 7, 7),
  (8, 'Ve a Libros → Alta de libro y escribe primero el ISBN: si el libro ya existe verás su ficha, y si se pidió en una solicitud de compra se cargan sus datos. Completa título, autor, editorial, año, tema, sinopsis y precio, guarda la ficha y agrega los ejemplares con su ubicación.', 8, 8);
