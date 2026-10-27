-- =====================================================================
-- Biblioteca Ducky - Datos semilla (tomados del prototipo de Figma)
-- Contraseña de todos los usuarios de prueba: Ducky2026!
-- =====================================================================
SET NAMES utf8mb4;
USE biblioteca_ducky;

-- Perfiles -----------------------------------------------------------
INSERT INTO Perfiles (id_perfil, Nombre_Rol, Descripcion_Perfil) VALUES
  (1, 'Administrador', 'Acceso completo al sistema.'),
  (2, 'Bibliotecario', 'Préstamos, devoluciones y catálogo.'),
  (3, 'Profesor', 'Consulta y préstamo de libros.'),
  (4, 'Alumno', 'Consulta y préstamo de libros.'),
  (5, 'Colaborador', 'Consulta y préstamo de libros.');

-- Funciones. Nombre_Funcion es el código que revisa la API; la etiqueta
-- visible va en Descripcion_Funcion con el formato 'Etiqueta: descripción'.
INSERT INTO Funciones (id_funcion, Nombre_Funcion, Descripcion_Funcion) VALUES
  (1, 'gestionar_usuarios', 'Gestión de usuarios: Alta, baja, consulta y cambio de datos de cuentas.'),
  (2, 'gestionar_libros', 'Gestión de libros: Alta, edición y baja de fichas y ejemplares.'),
  (3, 'buscar_libros', 'Búsqueda de libros: Buscar en el catálogo y ver el detalle de los libros.'),
  (4, 'generar_listado', 'Generación de listado: Imprimir o guardar en PDF el listado del catálogo.'),
  (5, 'solicitar_compra', 'Solicitud de compra: Pedir títulos nuevos o más ejemplares.'),
  (6, 'gestionar_compras', 'Gestión de compras: Aprobar, rechazar y recibir solicitudes de compra.'),
  (7, 'solicitar_prestamo', 'Solicitar préstamo: Pedir préstamos propios.'),
  (8, 'gestionar_prestamos', 'Gestión de préstamos: Registrar préstamos a cualquier usuario.'),
  (9, 'registrar_devolucion', 'Devoluciones: Registrar devoluciones de ejemplares.'),
  (10, 'renovar_prestamo', 'Renovación: Renovar préstamos propios.'),
  (11, 'gestionar_multas', 'Multas: Consultar deudores y registrar pagos de multas.'),
  (12, 'lista_espera', 'Lista de espera: Apartar libros sin copias para llevar.'),
  (13, 'gestionar_politicas', 'Políticas: Editar las políticas de la biblioteca.'),
  (14, 'usar_chatbot', 'Chatbot: Hacer preguntas al asistente.'),
  (15, 'gestionar_chatbot', 'Contenido del chatbot: Editar preguntas, respuestas y fuentes.');

INSERT INTO PerfilFuncion (id_funcion, id_perfil) VALUES
  (1, 1),
  (2, 1),
  (3, 1),
  (4, 1),
  (5, 1),
  (6, 1),
  (7, 1),
  (8, 1),
  (9, 1),
  (10, 1),
  (11, 1),
  (12, 1),
  (13, 1),
  (14, 1),
  (15, 1),
  (2, 2),
  (3, 2),
  (7, 2),
  (8, 2),
  (9, 2),
  (10, 2),
  (11, 2),
  (12, 2),
  (14, 2),
  (3, 3),
  (7, 3),
  (10, 3),
  (12, 3),
  (14, 3),
  (3, 4),
  (7, 4),
  (10, 4),
  (12, 4),
  (14, 4),
  (3, 5),
  (7, 5),
  (10, 5),
  (12, 5),
  (14, 5);

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

INSERT INTO Ejemplares (id_libro, num_copia, Estatus, Codigo, Pasillo, Estante, Nivel, Motivo_Baja, Fecha_Alta) VALUES
  (1, 1, 'Disponible', 'EJ-00101', '4', 'B · QA76.758', '2', NULL, '2026-08-12'),
  (1, 2, 'Disponible', 'EJ-00102', '4', 'B · QA76.758', '2', NULL, '2026-08-12'),
  (1, 3, 'Consulta externa', 'EJ-00103', '4', 'B · QA76.758', '2', NULL, '2026-08-12'),
  (1, 4, 'En prestamo', 'EJ-00104', '4', 'B · QA76.758', '2', NULL, '2026-08-12'),
  (1, 5, 'En prestamo', 'EJ-00105', '4', 'B · QA76.758', '2', NULL, '2026-08-12'),
  (2, 1, 'Disponible', 'EJ-00201', '4', 'B', '2', NULL, '2026-08-12'),
  (2, 2, 'En prestamo', 'EJ-00202', '4', 'B', '2', NULL, '2026-08-12'),
  (2, 3, 'Disponible', 'EJ-00203', '4', 'B', '2', NULL, '2026-08-12'),
  (2, 4, 'Consulta externa', 'EJ-00204', '4', 'B', '2', NULL, '2026-08-12'),
  (3, 1, 'Disponible', 'EJ-00301', '4', 'QA76.73', '3', NULL, '2026-08-12'),
  (3, 2, 'En prestamo', 'EJ-00302', '4', 'QA76.73', '3', NULL, '2026-08-12'),
  (3, 3, 'Consulta externa', 'EJ-00303', '4', 'QA76.73', '3', NULL, '2026-08-12'),
  (4, 1, 'En prestamo', 'EJ-00401', '5', 'QA76.76', '1', NULL, '2026-08-12'),
  (4, 2, 'En prestamo', 'EJ-00402', '5', 'QA76.76', '1', NULL, '2026-08-12'),
  (4, 3, 'En prestamo', 'EJ-00403', '5', 'QA76.76', '1', NULL, '2026-08-12'),
  (4, 4, 'Consulta externa', 'EJ-00404', '5', 'QA76.76', '1', NULL, '2026-08-12'),
  (5, 1, 'Disponible', 'EJ-00501', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (5, 2, 'Disponible', 'EJ-00502', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (5, 3, 'Consulta externa', 'EJ-00503', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (5, 4, 'Consulta externa', 'EJ-00504', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (5, 5, 'En prestamo', 'EJ-00505', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (5, 6, 'Consulta externa', 'EJ-00506', '4', 'TK5105', '2', NULL, '2026-08-12'),
  (6, 1, 'Disponible', 'EJ-00601', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 2, 'Disponible', 'EJ-00602', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 3, 'Disponible', 'EJ-00603', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 4, 'Consulta externa', 'EJ-00604', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 5, 'Consulta externa', 'EJ-00605', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 6, 'En prestamo', 'EJ-00606', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 7, 'En prestamo', 'EJ-00607', '3', 'QA303', '3', NULL, '2026-08-12'),
  (6, 8, 'Consulta externa', 'EJ-00608', '3', 'QA303', '3', NULL, '2026-08-12'),
  (7, 1, 'Disponible', 'EJ-00701', '4', 'QA76.76', '2', NULL, '2026-08-12'),
  (7, 2, 'Consulta externa', 'EJ-00702', '4', 'QA76.76', '2', NULL, '2026-08-12'),
  (7, 3, 'En prestamo', 'EJ-00703', '4', 'QA76.76', '2', NULL, '2026-08-12'),
  (8, 1, 'Disponible', 'EJ-00801', '4', 'QA76.73', '1', NULL, '2026-08-12'),
  (8, 2, 'Consulta externa', 'EJ-00802', '4', 'QA76.73', '1', NULL, '2026-08-12'),
  (8, 3, 'Consulta externa', 'EJ-00803', '4', 'QA76.73', '1', NULL, '2026-08-12'),
  (9, 1, 'Disponible', 'EJ-00901', '3', 'QA184', '2', NULL, '2026-08-12'),
  (9, 2, 'Consulta externa', 'EJ-00902', '3', 'QA184', '2', NULL, '2026-08-12'),
  (9, 3, 'Consulta externa', 'EJ-00903', '3', 'QA184', '2', NULL, '2026-08-12'),
  (10, 1, 'Disponible', 'EJ-01001', '2', 'QC21', '1', NULL, '2026-08-12'),
  (10, 2, 'Disponible', 'EJ-01002', '2', 'QC21', '1', NULL, '2026-08-12'),
  (10, 3, 'Consulta externa', 'EJ-01003', '2', 'QC21', '1', NULL, '2026-08-12'),
  (10, 4, 'Consulta externa', 'EJ-01004', '2', 'QC21', '1', NULL, '2026-08-12'),
  (11, 1, 'Disponible', 'EJ-01101', '5', 'QA76.9', '2', NULL, '2026-08-12'),
  (11, 2, 'Consulta externa', 'EJ-01102', '5', 'QA76.9', '2', NULL, '2026-08-12'),
  (11, 3, 'En prestamo', 'EJ-01103', '5', 'QA76.9', '2', NULL, '2026-08-12'),
  (12, 1, 'Disponible', 'EJ-01201', '4', 'QA76.758', '3', NULL, '2026-08-12'),
  (12, 2, 'Consulta externa', 'EJ-01202', '4', 'QA76.758', '3', NULL, '2026-08-12'),
  (12, 3, 'Consulta externa', 'EJ-01203', '4', 'QA76.758', '3', NULL, '2026-08-12'),
  (13, 1, 'Disponible', 'EJ-01301', '5', 'Q335', '1', NULL, '2026-08-12'),
  (13, 2, 'Consulta externa', 'EJ-01302', '5', 'Q335', '1', NULL, '2026-08-12'),
  (13, 3, 'En prestamo', 'EJ-01303', '5', 'Q335', '1', NULL, '2026-08-12'),
  (14, 1, 'Disponible', 'EJ-01401', '3', 'QA273', '2', NULL, '2026-08-12'),
  (14, 2, 'Consulta externa', 'EJ-01402', '3', 'QA273', '2', NULL, '2026-08-12'),
  (15, 1, 'Disponible', 'EJ-01501', '5', 'QA76.76', '3', NULL, '2026-08-12'),
  (15, 2, 'Consulta externa', 'EJ-01502', '5', 'QA76.76', '3', NULL, '2026-08-12'),
  (16, 1, 'Consulta externa', 'EJ-01601', '4', 'QA76.9', '2', NULL, '2026-08-12'),
  (16, 2, 'En prestamo', 'EJ-01602', '4', 'QA76.9', '2', NULL, '2026-08-12'),
  (17, 1, 'En prestamo', 'EJ-01701', '4', 'QA76.9', '3', NULL, '2026-08-12'),
  (17, 2, 'En prestamo', 'EJ-01702', '4', 'QA76.9', '3', NULL, '2026-08-12'),
  (18, 1, 'Disponible', 'EJ-01801', '2', 'QC23', '2', NULL, '2026-08-12'),
  (18, 2, 'Consulta externa', 'EJ-01802', '2', 'QC23', '2', NULL, '2026-08-12'),
  (19, 1, 'Baja', 'EJ-01901', '3', 'QA303', '1', 'Obsoleto', '2026-08-12');

-- Préstamos activos de las copias marcadas 'En prestamo'
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
INSERT INTO Devoluciones (id_prestamo, Fecha_Devolucion) VALUES (17, '2026-09-12');
INSERT INTO Multas (Cantidad_a_Pagar, id_usuario, id_prestamo, Justificacion) VALUES (45.00, 8, 17, 'Devolución con 4 día(s) de retraso y daño menor en la portada');

-- Solicitudes de compra ---------------------------------------------
INSERT INTO NuevosLibros (id_libro_nuevo, ISBN, Titulo, Autor, Editorial, Precio, Anio, Tema, Sinopsis) VALUES
  (1, '978-0-201-10088-4', 'Compilers: Principles, Techniques, and Tools', 'Aho, A. V.', 'Addison-Wesley', 1500.00, 1986, 'Computación', 'El libro del dragón sobre construcción de compiladores.');
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

-- Bitácora (actividad reciente del panel) ---------------------------
INSERT INTO Bitacora (id_usuario, Accion, Descripcion, Fecha) VALUES
  (1, 'SOLICITUD_COMPRA', 'Solicitud de compra: Clean Code · 3 copias', '2026-10-22 09:15:00'),
  (1, 'BAJA_COPIA', 'Baja de copia EJ-01901 (Obsoleto)', '2026-10-22 17:40:00'),
  (1, 'CAMBIO_ESTADO_COPIA', 'Cambio de estado: EJ-00303 de «El lenguaje de programación C» a Consulta externa', '2026-10-23 11:00:00');

-- Políticas -------------------------------------------------------------
INSERT INTO Politicas (Informacion) VALUES
  ('Las copias «Disponible» se consultan dentro de la biblioteca; solo las de «Consulta externa» se prestan a domicilio.'),
  ('El préstamo de un libro dura 7 días naturales.'),
  ('Cada préstamo puede renovarse hasta 2 veces, siempre que no esté vencido y nadie esté en lista de espera.'),
  ('Un usuario puede tener como máximo 3 préstamos activos.'),
  ('La multa por retraso es de $10.00 MXN por día. Con multas pendientes no se pueden solicitar préstamos.'),
  ('Tras 5 intentos fallidos de inicio de sesión la cuenta se bloquea; acude al mostrador para desbloquearla.');

-- Chatbot ---------------------------------------------------------------
INSERT INTO fuentesChatbot (id_fuentes, Fuente) VALUES
  (1, 'Reglamento de la Biblioteca Ducky'),
  (2, 'Manual de usuario del sistema Biblio');

INSERT INTO preguntasChatbot (id_preguntas, Pregunta) VALUES
  (1, '¿Cuántos días dura un préstamo?'),
  (2, '¿Cuántas veces puedo renovar un préstamo?'),
  (3, '¿Cuánto cuesta la multa por retraso?'),
  (4, '¿Cómo me inscribo en la lista de espera de un libro?'),
  (5, '¿Qué diferencia hay entre Disponible y Consulta externa?');

INSERT INTO contenidosChatbot (Respuesta, id_preguntas, id_fuentes) VALUES
  ('Un préstamo dura 7 días naturales a partir de la fecha en que recoges el libro.', 1, 1),
  ('Puedes renovar cada préstamo hasta 2 veces, si no está vencido y nadie lo tiene apartado.', 2, 1),
  ('La multa es de $10.00 MXN por cada día de retraso.', 3, 1),
  ('Busca el libro en el catálogo; si no hay copias para llevar, pulsa «Apartar» y te avisaremos cuando se libere una.', 4, 2),
  ('«Disponible» se consulta dentro de la biblioteca; «Consulta externa» se puede llevar a casa en préstamo.', 5, 1);
