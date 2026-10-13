package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PropietarioRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long idUsuario;

    @NotBlank(message = "La dirección es obligatoria")
    @Size(max = 200, message = "La dirección no debe superar los 200 caracteres")
    private String direccion;
}