package pe.edu.utec.vetcare.service.impl;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pe.edu.utec.vetcare.dto.request.UsuarioRequest;
import pe.edu.utec.vetcare.dto.request.ActualizarUsuarioRequest;
import pe.edu.utec.vetcare.dto.response.UsuarioResponse;
import pe.edu.utec.vetcare.entity.RolEntity;
import pe.edu.utec.vetcare.entity.UsuarioEntity;
import pe.edu.utec.vetcare.exception.BadRequestException;
import pe.edu.utec.vetcare.exception.ResourceNotFoundException;
import pe.edu.utec.vetcare.mapper.UsuarioMapper;
import pe.edu.utec.vetcare.repository.RolRepository;
import pe.edu.utec.vetcare.repository.UsuarioRepository;
import pe.edu.utec.vetcare.service.UsuarioService;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UsuarioServiceImpl
        implements UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final UsuarioMapper usuarioMapper;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional(readOnly = true)
    public List<UsuarioResponse> listar() {

        return usuarioRepository.findAll()
                .stream()
                .map(usuarioMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public UsuarioResponse obtener(Long id) {

        return usuarioMapper.toResponse(
                buscarUsuario(id)
        );
    }

    @Override
    @Transactional
    public UsuarioResponse crear(UsuarioRequest request) {

        pe.edu.utec.vetcare.validation.PoliticaContrasena.validar(request.getContrasena());
        if (usuarioRepository.existsByCorreo(request.getCorreo())) {
            throw new BadRequestException("El correo ya se encuentra registrado");
        }

        if (usuarioRepository.existsByNroDocumento(request.getNroDocumento())) {
            throw new BadRequestException("El documento ya se encuentra registrado");
        }

        RolEntity rol = rolRepository
                .findById(request.getIdRol())
                .orElseThrow(() -> new ResourceNotFoundException("Rol no encontrado"));

        UsuarioEntity entity = usuarioMapper.toEntity(request);

        entity.setRol(rol);

        entity.setContrasena(passwordEncoder.encode(request.getContrasena()));

        return usuarioMapper.toResponse(usuarioRepository.save(entity));
    }

    @Override
    @Transactional
    public UsuarioResponse actualizar(Long id, ActualizarUsuarioRequest request) {
        UsuarioEntity entity = buscarUsuario(id);

        if (usuarioRepository.existsByCorreoAndIdUsuarioNot(request.getCorreo(), id)) {
            throw new BadRequestException("El correo ya se encuentra registrado");
        }
        if (usuarioRepository.existsByNroDocumentoAndIdUsuarioNot(request.getNroDocumento(), id)) {
            throw new BadRequestException("El documento ya se encuentra registrado");
        }

        usuarioMapper.updateEntity(request, entity);
        // La contraseña y el rol permanecen intactos en esta operación.
        return usuarioMapper.toResponse(usuarioRepository.save(entity));
    }

    @Override
    @Transactional
    public void eliminar(Long id) {

        UsuarioEntity entity = buscarUsuario(id);

        var auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth instanceof org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken jwt) {
            Object actual = jwt.getToken().getClaim("idUsuario");
            if (actual instanceof Number idActual && entity.getIdUsuario().equals(idActual.longValue()))
                throw new BadRequestException("No puedes eliminar la cuenta con la que iniciaste sesión");
        }
        usuarioRepository.delete(entity);
    }

    private UsuarioEntity buscarUsuario(Long id) {

        return usuarioRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado"));
    }
}