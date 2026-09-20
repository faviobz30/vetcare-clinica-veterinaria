package pe.edu.utec.vetcare.dto.response;

import lombok.Data;

import java.time.LocalDate;

@Data
public class PropietarioResponse {

    private Long idPropietario;

    private Long idUsuario;

    private String nombres;

    private String apellidos;

    private String direccion;

    private LocalDate fechaRegistroClinica;

    private String estadoCliente;
}