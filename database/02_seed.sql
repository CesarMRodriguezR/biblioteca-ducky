-- =====================================================================
-- Biblioteca Ducky - Datos semilla (tomados del prototipo de Figma)
-- Contraseña de todos los usuarios de prueba: Ducky2026!
-- =====================================================================
SET NAMES utf8mb4;
USE biblioteca_ducky;

-- Perfiles -----------------------------------------------------------
INSERT INTO Perfiles (id_perfil, Nombre_Rol, Descripcion_Perfil) VALUES
  (1, 'Administrador', 'Acceso completo al sistema.'),
  (2, 'Bibliotecario', 'Búsqueda de libros en el catálogo.'),
  (3, 'Profesor', 'Búsqueda de libros en el catálogo.'),
  (4, 'Alumno', 'Búsqueda de libros en el catálogo.'),
  (5, 'Colaborador', 'Búsqueda de libros en el catálogo.');

-- Funciones. Nombre_Funcion es el código que revisa la API; la etiqueta
-- visible va en Descripcion_Funcion con el formato 'Etiqueta: descripción'.
-- Solo las tres funciones del prototipo.
INSERT INTO Funciones (id_funcion, Nombre_Funcion, Descripcion_Funcion) VALUES
  (1, 'gestionar_usuarios', 'Gestión de usuarios: Alta, baja, cambio y consulta de usuarios, y gestión de perfiles.'),
  (2, 'gestionar_libros', 'Gestión de libros: Alta, baja, cambio y consulta de libros, solicitud de compra y listado.'),
  (3, 'buscar_libros', 'Búsqueda de libros: Buscar en el catálogo con filtros y ver el detalle de los libros.');

-- El Administrador tiene las tres; los demás perfiles (incluido Bibliotecario) solo buscan.
INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (3, 2),
  (3, 3),
  (3, 4),
  (3, 5);

-- Usuarios -----------------------------------------------------------
SET @hash = '$2b$10$63TcTHQUM5MCxcb1X6BqGeYK3IEWv.Sb0af27V3uvvaBW1ugkPg56';
INSERT INTO Usuarios (id_usuario, Nombre_Usuario, Contrasena_Usuario, Matricula_Nomina, id_perfil, Nombre_Completo, Correo, Estatus) VALUES
  (1, 'felipe.rodriguez', @hash, '1001133', 1, 'Felipe Rodríguez', 'felipe.rodriguez@ducky.edu.mx', 'Activo'),
  (2, 'catherine.ramirez', @hash, '2004720', 2, 'Catherine Ramírez', 'catherine.ramirez@ducky.edu.mx', 'Activo'),
  (3, 'javier.saavedra', @hash, '1987345', 3, 'Javier Saavedra', 'javier.saavedra@ducky.edu.mx', 'Activo'),
  (4, 'marcela.guerra', @hash, '3105843', 4, 'Marcela Guerra', 'marcela.guerra@ducky.edu.mx', 'Activo'),
  (5, 'cesar.rodriguez', @hash, '2005872', 5, 'César Rodríguez', 'cesar.rodriguez@ducky.edu.mx', 'Activo'),
  (6, 'diego.fuentes', @hash, '3098117', 4, 'Diego Alberto Fuentes Cano', 'diego.fuentes@ducky.edu.mx', 'Activo'),
  (7, 'maria.ortiz', @hash, '3112390', 4, 'María Fernanda Ortiz Vega', 'maria.ortiz@ducky.edu.mx', 'Activo'),
  (8, 'luis.moreno', @hash, '3120558', 4, 'Luis Ángel Moreno Ríos', 'luis.moreno@ducky.edu.mx', 'Activo'),
  (9, 'hector.villarreal', @hash, '2005871', 5, 'Héctor Villarreal', 'hector.villarreal@ducky.edu.mx', 'Activo');

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
  (1, 3, 'Consulta Externa', 'P4-EB-N2-SComputación', NULL),
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
  (4, 2, 'En préstamo', 'P5-EQA76.76-N1-SComputación', NULL),
  (4, 3, 'En préstamo', 'P5-EQA76.76-N1-SComputación', NULL),
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
  (6, 7, 'En préstamo', 'P3-EQA303-N3-SMatemáticas', NULL),
  (6, 8, 'Consulta Externa', 'P3-EQA303-N3-SMatemáticas', NULL),
  (7, 1, 'Disponible', 'P4-EQA76.76-N2-SComputación', NULL),
  (7, 2, 'Consulta Externa', 'P4-EQA76.76-N2-SComputación', NULL),
  (7, 3, 'En préstamo', 'P4-EQA76.76-N2-SComputación', NULL),
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

-- Préstamos activos de las copias marcadas 'En préstamo'
INSERT INTO Prestamos (id_prestamo, Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia) VALUES
  (1, '2026-10-20', '2026-10-27', 'Activo', 8, 1, 4),
  (2, '2026-10-19', '2026-10-26', 'Activo', 7, 1, 5),
  (3, '2026-10-18', '2026-10-25', 'Activo', 4, 2, 2),
  (4, '2026-10-17', '2026-10-24', 'Activo', 3, 3, 2),
  (5, '2026-10-21', '2026-10-28', 'Activo', 5, 4, 1),
  (6, '2026-10-20', '2026-10-27', 'Activo', 2, 4, 2),
  (7, '2026-10-19', '2026-10-26', 'Activo', 7, 4, 3),
  (8, '2026-10-18', '2026-10-25', 'Activo', 4, 5, 5),
  (9, '2026-10-17', '2026-10-24', 'Activo', 3, 6, 6),
  (10, '2026-10-21', '2026-10-28', 'Activo', 5, 6, 7),
  (11, '2026-10-20', '2026-10-27', 'Activo', 2, 7, 3),
  (12, '2026-10-19', '2026-10-26', 'Activo', 7, 11, 3),
  (13, '2026-10-18', '2026-10-25', 'Activo', 4, 13, 3),
  (14, '2026-10-17', '2026-10-24', 'Activo', 3, 16, 2),
  (15, '2026-10-21', '2026-10-28', 'Activo', 5, 17, 1),
  (16, '2026-10-20', '2026-10-27', 'Activo', 2, 17, 2);

-- Historial: préstamo devuelto con retraso y multa pendiente de luis.moreno
INSERT INTO Prestamos (id_prestamo, Fecha_Prestamo, Fecha_Entrega_Programada, Estado, id_usuario, id_libro, num_copia) VALUES
  (17, '2026-09-01', '2026-09-08', 'Devuelto', 8, 12, 1);
INSERT INTO Devoluciones (id_devolucion, id_prestamo, Fecha_Devolucion) VALUES (1, 17, '2026-09-12');
INSERT INTO Multas (id_multa, Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion) VALUES (1, 45.00, 8, 17, 'Devolución con 4 día(s) de retraso y daño menor en la portada');

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

-- Políticas -------------------------------------------------------------
INSERT INTO Politicas (id_politica, Informacion) VALUES
  (1, 'Las copias «Disponible» se consultan dentro de la biblioteca; solo las de «Consulta externa» se prestan a domicilio.'),
  (2, 'El préstamo de un libro dura 7 días naturales.'),
  (3, 'Cada préstamo puede renovarse hasta 2 veces, siempre que no esté vencido y nadie esté en lista de espera.'),
  (4, 'Un usuario puede tener como máximo 3 préstamos activos.'),
  (5, 'La multa por retraso es de $10.00 MXN por día. Con multas pendientes no se pueden solicitar préstamos.');

-- Chatbot ---------------------------------------------------------------
INSERT INTO FuentesChatbot (id_fuente, Fuente) VALUES
  (1, 'Reglamento de la Biblioteca Ducky'),
  (2, 'Manual de usuario del sistema Biblio');

INSERT INTO PreguntasChatbot (id_pregunta, Pregunta) VALUES
  (1, '¿Cuántos días dura un préstamo?'),
  (2, '¿Cuántas veces puedo renovar un préstamo?'),
  (3, '¿Cuánto cuesta la multa por retraso?'),
  (4, '¿Cómo me inscribo en la lista de espera de un libro?'),
  (5, '¿Qué diferencia hay entre Disponible y Consulta externa?');

INSERT INTO ContenidosChatbot (id_contenido, Respuesta, id_pregunta, id_fuente) VALUES
  (1, 'Un préstamo dura 7 días naturales a partir de la fecha en que recoges el libro.', 1, 1),
  (2, 'Puedes renovar cada préstamo hasta 2 veces, si no está vencido y nadie lo tiene apartado.', 2, 1),
  (3, 'La multa es de $10.00 MXN por cada día de retraso.', 3, 1),
  (4, 'Busca el libro en el catálogo; si no hay copias para llevar, pulsa «Apartar» y te avisaremos cuando se libere una.', 4, 2),
  (5, '«Disponible» se consulta dentro de la biblioteca; «Consulta externa» se puede llevar a casa en préstamo.', 5, 1);
