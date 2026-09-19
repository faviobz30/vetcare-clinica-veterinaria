package pe.edu.utec.vetcare.dto.response;

import lombok.Data;
import pe.edu.utec.vetcare.enums.EstadoCita;

import java.time.LocalDateTime;

@Data
public class CitaResponse {

    private Integer idCita;

    private Integer idVeterinario;

    // PROVISIONAL
    private Integer idMascota;

    private LocalDateTime fechaCita;

    private EstadoCita estado;

    private String motivoCita;
}