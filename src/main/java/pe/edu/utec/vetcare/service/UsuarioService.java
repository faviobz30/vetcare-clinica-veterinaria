package pe.edu.utec.vetcare.service;

import pe.edu.utec.vetcare.dto.request.UsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;

import java.util.List;

public interface UsuarioService {

    List<UsuarioResponse> listar();

    UsuarioResponse obtener(Long id);

    UsuarioResponse crear(UsuarioRequest request);

    UsuarioResponse actualizar(
            Long id,
            UsuarioRequest request
    );

    void eliminar(Long id);
}