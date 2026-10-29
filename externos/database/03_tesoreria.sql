-- =====================================================================
-- Tesorería - sistema externo simulado
-- Recibe las solicitudes de compra que envía Biblio (POST
-- /tesoreria/api/solicitudes). Desde este sistema se aceptan o rechazan
-- (POST /tesoreria/api/solicitudes/:folio/aceptar | rechazar, o con
-- "npm run tesoreria") y la respuesta se notifica a Biblio.
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
