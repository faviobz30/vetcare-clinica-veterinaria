package pe.edu.utec.vetcare.dto.response;

import lombok.Data;

@Data
public class VeterinarioResponse {

    private Integer idVeterinario;
    private Integer idUsuario; // PROVISIONAL
    private String especialidad;
    private String nroColegiatura;
}