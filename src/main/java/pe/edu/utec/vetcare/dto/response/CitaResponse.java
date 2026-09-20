package pe.edu.utec.vetcare.dto.response;

import lombok.Data;
import pe.edu.utec.vetcare.enums.EstadoCita;

import java.time.LocalDateTime;

@Data
public class CitaResponse {

    private Long idCita;

    private Long idVeterinario;

    // PROVISIONAL
    private Long idMascota;

    private LocalDateTime fechaCita;

    private EstadoCita estado;

    private String motivoCita;
}