package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ActualizarPerfilVeterinarioRequest {
    @Size(max = 100, message = "El nombre no puede superar 100 caracteres")
    private String nombres;

    @Size(max = 100, message = "Los apellidos no pueden superar 100 caracteres")
    private String apellidos;

    @Size(max = 20, message = "El celular no puede superar 20 caracteres")
    private String nroCelular;
}
