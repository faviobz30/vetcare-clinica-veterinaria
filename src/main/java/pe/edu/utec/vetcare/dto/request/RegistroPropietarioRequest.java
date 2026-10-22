package pe.edu.utec.vetcare.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegistroPropietarioRequest(
        @NotBlank @Size(max = 100) String nombres,
        @NotBlank @Size(max = 100) String apellidos,
        @NotBlank @Size(max = 20) String tipoDocumento,
        @NotBlank @Size(max = 20) String nroDocumento,
        @NotBlank @Email @Size(max = 150) String correo,
        @NotBlank @Size(min = 6, max = 72) String contrasena,
        @Size(max = 20) String nroCelular,
        @Size(max = 200) String direccion
) {}
