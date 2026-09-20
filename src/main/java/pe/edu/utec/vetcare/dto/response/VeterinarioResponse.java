package pe.edu.utec.vetcare.dto.response;

import lombok.Data;

@Data
public class VeterinarioResponse {

    private Long idVeterinario;
    private Long idUsuario; // PROVISIONAL
    private String especialidad;
    private String nroColegiatura;
}