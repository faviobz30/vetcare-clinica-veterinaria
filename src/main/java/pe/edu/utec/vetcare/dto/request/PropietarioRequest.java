package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PropietarioRequest {

    @NotNull(message = "El usuario es obligatorio")
    private Long idUsuario;

    @Size(max = 200)
    private String direccion;
}