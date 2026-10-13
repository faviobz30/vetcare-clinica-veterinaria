package pe.edu.utec.vetcare.dto.response;

import lombok.Data;

@Data
public class VeterinarioResponse {

    private Long idVeterinario;
    private Long idUsuario;
    private String especialidad;
    private String nroColegiatura;
}