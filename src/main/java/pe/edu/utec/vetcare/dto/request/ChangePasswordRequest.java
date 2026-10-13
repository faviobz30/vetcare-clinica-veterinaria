package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ChangePasswordRequest {

    @NotBlank(message = "La contraseña actual es obligatoria")
    private String contrasenaActual;

    @NotBlank(message = "La nueva contraseña es obligatoria")
    @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
    private String nuevaContrasena;

    @Data
    public static class UpdateMyProfileRequest {

        @NotBlank(message = "Los nombres son obligatorios")
        @Size(max = 100)
        private String nombres;

        @NotBlank(message = "Los apellidos son obligatorios")
        @Size(max = 100)
        private String apellidos;

        @NotBlank(message = "El correo es obligatorio")
        @Email(message = "El correo no tiene un formato válido")
        private String correo;

        @Size(max = 20)
        private String nroCelular;
    }
}