package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.ChangePasswordRequest;
import pe.edu.utec.vetcare.dto.request.CreateUsuarioRequest;
import pe.edu.utec.vetcare.dto.request.UpdateMyProfileRequest;
import pe.edu.utec.vetcare.dto.request.UpdateUsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;

import java.util.List;

public interface UsuarioService {

    List<UsuarioResponse> listar();

    UsuarioResponse obtener(Long id);

    UsuarioResponse crear(CreateUsuarioRequest request);

    UsuarioResponse actualizar(
            Long id,
            UpdateUsuarioRequest request
    );

    UsuarioResponse actualizarMiPerfil(
            UpdateMyProfileRequest request
    );

    void cambiarContrasena(
            Long id,
            ChangePasswordRequest request
    );

    void eliminar(Long id);
}