package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateCitaRequest {

    @NotNull(message = "El veterinario es obligatorio")
    private Integer idVeterinario;

    // PROVISIONAL
    @NotNull(message = "La mascota es obligatoria")
    private Integer idMascota;

    @NotNull(message = "La fecha de la cita es obligatoria")
    @Future(message = "La fecha de la cita debe ser futura")
    private LocalDateTime fechaCita;

    @NotBlank(message = "El motivo de la cita es obligatorio")
    @Size(max = 250, message = "El motivo no puede superar 250 caracteres")
    private String motivoCita;
}