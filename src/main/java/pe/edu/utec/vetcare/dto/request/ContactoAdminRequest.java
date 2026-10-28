package pe.edu.utec.vetcare.dto.request;
import jakarta.validation.constraints.*;
public record ContactoAdminRequest(
 @Size(max=20) @Pattern(regexp="[+]?[0-9][0-9 ()-]{5,19}") String nroCelular,
 @Size(max=200) String direccion
) {}
