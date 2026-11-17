-- =====================================================================
-- Tesorería - sistema externo simulado
-- Recibe las solicitudes de compra que envía Biblio (POST
-- /tesoreria/api/solicitudes). Desde este sistema se aceptan o rechazan
-- (POST /tesoreria/api/solicitudes/:folio/aceptar | rechazar, o con
-- "npm run tesoreria") y la respuesta se notifica a Biblio.
--
-- También recibe las multas de la biblioteca (POST /tesoreria/api/multas).
-- Cuando el lector paga en caja se registra el pago (POST
-- /tesoreria/api/multas/:referencia/pagar o "npm run tesoreria -- pagar") y
-- Tesorería avisa a Biblio para que marque la multa como pagada.
-- =====================================================================
SET NAMES utf8mb4;

DROP DATABASE IF EXISTS tesoreria_ducky;
CREATE DATABASE tesoreria_ducky
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE tesoreria_ducky;

CREATE TABLE Presupuestos (
  Periodo        CHAR(7)        NOT NULL COMMENT 'AAAA-MM',
  Area           VARCHAR(80)    NOT NULL,
  Monto          DECIMAL(12,2)  NOT NULL,
  PRIMARY KEY (Periodo, Area)
) ENGINE=InnoDB;

CREATE TABLE Solicitudes (
  id_solicitud     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  Folio            VARCHAR(40)    NOT NULL,
  Sistema_Origen   VARCHAR(40)    NOT NULL DEFAULT 'Biblio',
  Referencia       VARCHAR(40)    NOT NULL COMMENT 'Id de la orden en el sistema de origen',
  Solicitante      VARCHAR(150)   NOT NULL,
  Fecha_Solicitud  DATE           NOT NULL,
  Total            DECIMAL(12,2)  NOT NULL DEFAULT 0.00,
  Estatus          ENUM('Recibida','Aceptada','Rechazada') NOT NULL DEFAULT 'Recibida',
  Motivo           VARCHAR(255)   NULL,
  Fecha_Recepcion  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Fecha_Respuesta  DATETIME       NULL,
  Notificada       BOOLEAN        NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_solicitud),
  UNIQUE KEY uq_solicitudes_folio (Folio),
  UNIQUE KEY uq_solicitudes_referencia (Sistema_Origen, Referencia)
) ENGINE=InnoDB;

CREATE TABLE Renglones (
  id_solicitud     INT UNSIGNED   NOT NULL,
  Numero           SMALLINT UNSIGNED NOT NULL,
  Titulo           VARCHAR(200)   NOT NULL,
  ISBN             VARCHAR(17)    NULL,
  Editorial        VARCHAR(120)   NULL,
  Cantidad         INT UNSIGNED   NOT NULL,
  Precio_Unitario  DECIMAL(10,2)  NOT NULL DEFAULT 0.00,
  PRIMARY KEY (id_solicitud, Numero),
  CONSTRAINT fk_renglones_solicitud FOREIGN KEY (id_solicitud)
    REFERENCES Solicitudes (id_solicitud) ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE Multas (
  id_multa         INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  Sistema_Origen   VARCHAR(40)    NOT NULL DEFAULT 'Biblio',
  Referencia       VARCHAR(40)    NOT NULL COMMENT 'Id de la multa en el sistema de origen',
  Matricula        VARCHAR(20)    NOT NULL,
  Lector           VARCHAR(150)   NOT NULL,
  Motivo           VARCHAR(80)    NOT NULL,
  Monto            DECIMAL(10,2)  NOT NULL,
  Fecha_Multa      DATE           NOT NULL,
  Estatus          ENUM('Pendiente','Pagada') NOT NULL DEFAULT 'Pendiente',
  Fecha_Recepcion  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_multa),
  UNIQUE KEY uq_multas_referencia (Sistema_Origen, Referencia)
) ENGINE=InnoDB;

CREATE TABLE Pagos (
  id_pago     INT UNSIGNED   NOT NULL AUTO_INCREMENT,
  Folio       VARCHAR(40)    NOT NULL,
  id_multa    INT UNSIGNED   NOT NULL,
  Monto       DECIMAL(10,2)  NOT NULL,
  Fecha_Pago  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  Notificado  BOOLEAN        NOT NULL DEFAULT FALSE,
  PRIMARY KEY (id_pago),
  UNIQUE KEY uq_pagos_folio (Folio),
  UNIQUE KEY uq_pagos_multa (id_multa),
  CONSTRAINT fk_pagos_multa FOREIGN KEY (id_multa)
    REFERENCES Multas (id_multa) ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE=InnoDB;

INSERT INTO Presupuestos (Periodo, Area, Monto) VALUES
  ('2026-10', 'Biblioteca', 60000.00),
  ('2026-11', 'Biblioteca', 60000.00);

-- Solicitudes de Biblio que Tesorería ya recibió (coinciden con las
-- órdenes 2 y 3 de la semilla de Biblio).
INSERT INTO Solicitudes
  (id_solicitud, Folio, Referencia, Solicitante, Fecha_Solicitud, Total, Estatus,
   Fecha_Recepcion, Fecha_Respuesta, Notificada) VALUES
  (1, 'TES-2026-0001', '3', 'Felipe Rodríguez', '2026-10-01', 3920.00, 'Aceptada',
   '2026-10-01 10:00:00', '2026-10-03 12:30:00', TRUE),
  (2, 'TES-2026-0002', '2', 'Felipe Rodríguez', '2026-10-15', 3900.00, 'Recibida',
   '2026-10-15 09:20:00', NULL, FALSE);

INSERT INTO Renglones (id_solicitud, Numero, Titulo, ISBN, Editorial, Cantidad, Precio_Unitario) VALUES
  (1, 1, 'Sistemas operativos modernos', '978-607-442-046-3', 'Pearson', 4, 980.00),
  (2, 1, 'El lenguaje de programación C', '978-0-13-110362-7', 'Prentice Hall', 6, 650.00);

-- Multas de Biblio que Tesorería ya recibió (coinciden con las multas 1 a 5 y 7 de
-- la semilla de Biblio; la 6 aún no se envía). Las 2, 3 y 7 ya se pagaron; la 7
-- hace 2 días, para que se vea en el filtro «Últimos 7 días» de Biblio.
SET @hoy = CURRENT_DATE;
INSERT INTO Multas
  (id_multa, Referencia, Matricula, Lector, Motivo, Monto, Fecha_Multa, Estatus) VALUES
  (1, '1', '3120558', 'Luis Ángel Moreno Ríos', 'Entrega extemporánea', 45.00,
   DATE_SUB(@hoy, INTERVAL 59 DAY), 'Pendiente'),
  (2, '2', '3105843', 'Marcela Guerra', 'Entrega extemporánea', 20.00,
   DATE_SUB(@hoy, INTERVAL 51 DAY), 'Pagada'),
  (3, '3', '3109921', 'Ana López', 'Daño del libro', 250.00,
   DATE_SUB(@hoy, INTERVAL 53 DAY), 'Pagada'),
  (4, '4', '3109921', 'Ana López', 'Entrega extemporánea', 40.00,
   DATE_SUB(@hoy, INTERVAL 19 DAY), 'Pendiente'),
  (5, '5', '3109921', 'Ana López', 'Entrega extemporánea', 70.00,
   DATE_SUB(@hoy, INTERVAL 2 DAY), 'Pendiente'),
  (6, '7', '3105843', 'Marcela Guerra', 'Entrega extemporánea', 30.00,
   DATE_SUB(@hoy, INTERVAL 10 DAY), 'Pagada');

INSERT INTO Pagos (id_pago, Folio, id_multa, Monto, Fecha_Pago, Notificado) VALUES
  (1, CONCAT('TES-', DATE_FORMAT(DATE_SUB(@hoy, INTERVAL 50 DAY), '%Y-%m'), '-0001'), 3, 250.00,
   TIMESTAMP(DATE_SUB(@hoy, INTERVAL 50 DAY), '11:20:00'), TRUE),
  (2, CONCAT('TES-', DATE_FORMAT(DATE_SUB(@hoy, INTERVAL 45 DAY), '%Y-%m'), '-0002'), 2, 20.00,
   TIMESTAMP(DATE_SUB(@hoy, INTERVAL 45 DAY), '17:02:00'), TRUE),
  (3, CONCAT('TES-', DATE_FORMAT(DATE_SUB(@hoy, INTERVAL 2 DAY), '%Y-%m'), '-0003'), 6, 30.00,
   TIMESTAMP(DATE_SUB(@hoy, INTERVAL 2 DAY), '17:02:00'), TRUE);
